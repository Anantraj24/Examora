from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.core.security import create_exam_session_token
from app.models.models import (
    User, Exam, ExamSession, SessionStatus, QuestionBank, StudentAnswer,
    ExamResult, IntegrityStatus, QuestionType, ExamQuestion, SubjectiveEvaluation
)
from app.schemas.schemas import SessionStartRequest, StudentExamPaperOut, PaperQuestionView, OptionStudentOut
from app.services.paper_generator import generate_randomized_paper
from app.services.auto_grader import evaluate_objective_answer
from app.services.llm_evaluator import evaluate_subjective_answer

router = APIRouter()

@router.post("/start", response_model=StudentExamPaperOut)
async def start_exam_session(
    req: SessionStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch Exam
    exam_query = select(Exam).options(
        selectinload(Exam.questions).selectinload(ExamQuestion.question).selectinload(QuestionBank.options)
    ).where(Exam.id == req.exam_id)
    result = await db.execute(exam_query)
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if not exam.is_published:
        raise HTTPException(status_code=400, detail="Exam is not published yet")

    now = datetime.now(timezone.utc)
    
    # Check if student already has an active or submitted session for this exam
    sess_query = select(ExamSession).where(
        ExamSession.exam_id == exam.id,
        ExamSession.student_id == current_user.id
    )
    existing_sess = (await db.execute(sess_query)).scalar_one_or_none()
    
    if existing_sess:
        session = existing_sess
        if session.status in [SessionStatus.SUBMITTED, SessionStatus.TIMED_OUT, SessionStatus.DISQUALIFIED]:
            raise HTTPException(status_code=400, detail=f"Exam already completed with status: {session.status}")
    else:
        # Create brand new session
        server_deadline = now + timedelta(minutes=exam.duration_minutes)
        import uuid
        temp_id = str(uuid.uuid4())
        session_token = create_exam_session_token(current_user.id, exam.id, temp_id)
        
        session = ExamSession(
            id=temp_id,
            exam_id=exam.id,
            student_id=current_user.id,
            session_token=session_token,
            status=SessionStatus.IN_PROGRESS,
            started_at=now,
            server_deadline=server_deadline,
            total_tab_switches=0,
            final_suspicion_score=0.0
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        
    # Gather all available questions for this exam
    all_questions = [eq.question for eq in exam.questions if eq.question]
    if not all_questions:
        # Fallback: query subject question pool if explicit associations weren't added
        pool_q = select(QuestionBank).options(selectinload(QuestionBank.options)).where(QuestionBank.subject == exam.subject)
        all_questions = (await db.execute(pool_q)).scalars().all()
        
    paper_list = generate_randomized_paper(exam, all_questions, current_user.id)
    
    # Fetch existing saved answers if any
    ans_query = select(StudentAnswer).where(StudentAnswer.session_id == session.id)
    saved_answers = (await db.execute(ans_query)).scalars().all()
    ans_map = {a.question_id: a for a in saved_answers}
    
    paper_views = []
    for item in paper_list:
        saved_ans = ans_map.get(item["id"])
        saved_dict = None
        if saved_ans:
            saved_dict = {
                "selected_option_ids": saved_ans.selected_option_ids,
                "text_response": saved_ans.text_response,
                "image_path": saved_ans.image_path,
                "word_count": saved_ans.word_count
            }
            
        paper_views.append(PaperQuestionView(
            id=item["id"],
            order_index=item["order_index"],
            question_type=item["question_type"],
            difficulty=item["difficulty"],
            content=item["content"],
            max_marks=item["max_marks"],
            negative_marks=item["negative_marks"],
            options=[OptionStudentOut(**opt) for opt in item["options"]],
            saved_answer=saved_dict
        ))
        
    deadline = session.server_deadline
    if deadline and deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    remaining_seconds = max(0, int((deadline - now).total_seconds())) if deadline else 0
    
    return StudentExamPaperOut(
        session_id=session.id,
        session_token=session.session_token,
        exam_id=exam.id,
        exam_title=exam.title,
        duration_minutes=exam.duration_minutes,
        server_deadline=deadline or now,
        server_time_remaining_seconds=remaining_seconds,
        proctoring_config=exam.proctoring_config or {},
        questions=paper_views
    )

@router.get("/paper/{session_id}", response_model=StudentExamPaperOut)
async def get_exam_paper(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(ExamSession).options(
        selectinload(ExamSession.exam).selectinload(Exam.questions).selectinload(ExamQuestion.question).selectinload(QuestionBank.options)
    ).where(ExamSession.id == session_id)
    
    result = await db.execute(query)
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")
    if session.student_id != current_user.id and current_user.role == "student":
        raise HTTPException(status_code=403, detail="Unauthorized access to session")
        
    now = datetime.now(timezone.utc)
    exam = session.exam
    
    # Check if time expired
    deadline = session.server_deadline
    if deadline and deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
        
    if session.status == SessionStatus.IN_PROGRESS and deadline and deadline <= now:
        session.status = SessionStatus.TIMED_OUT
        session.submitted_at = now
        await db.commit()
        
    all_questions = [eq.question for eq in exam.questions if eq.question]
    paper_list = generate_randomized_paper(exam, all_questions, session.student_id)
    
    ans_query = select(StudentAnswer).where(StudentAnswer.session_id == session.id)
    saved_answers = (await db.execute(ans_query)).scalars().all()
    ans_map = {a.question_id: a for a in saved_answers}
    
    paper_views = []
    for item in paper_list:
        saved_ans = ans_map.get(item["id"])
        saved_dict = None
        if saved_ans:
            saved_dict = {
                "selected_option_ids": saved_ans.selected_option_ids,
                "text_response": saved_ans.text_response,
                "image_path": saved_ans.image_path,
                "word_count": saved_ans.word_count
            }
            
        paper_views.append(PaperQuestionView(
            id=item["id"],
            order_index=item["order_index"],
            question_type=item["question_type"],
            difficulty=item["difficulty"],
            content=item["content"],
            max_marks=item["max_marks"],
            negative_marks=item["negative_marks"],
            options=[OptionStudentOut(**opt) for opt in item["options"]],
            saved_answer=saved_dict
        ))
        
    remaining_seconds = max(0, int((deadline - now).total_seconds())) if deadline else 0
    
    return StudentExamPaperOut(
        session_id=session.id,
        session_token=session.session_token,
        exam_id=exam.id,
        exam_title=exam.title,
        duration_minutes=exam.duration_minutes,
        server_deadline=deadline or now,
        server_time_remaining_seconds=remaining_seconds,
        proctoring_config=exam.proctoring_config or {},
        questions=paper_views
    )

@router.post("/submit-final/{session_id}")
async def submit_exam_final(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(ExamSession).options(selectinload(ExamSession.exam)).where(ExamSession.id == session_id)
    result = await db.execute(query)
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")
    if session.student_id != current_user.id and current_user.role == "student":
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    now = datetime.now(timezone.utc)
    session.status = SessionStatus.SUBMITTED
    session.submitted_at = now
    
    # Evaluate all answers
    ans_query = select(StudentAnswer).options(selectinload(StudentAnswer.question).selectinload(QuestionBank.options)).where(StudentAnswer.session_id == session.id)
    answers = (await db.execute(ans_query)).scalars().all()
    
    objective_total = 0.0
    max_total = 0.0
    
    for ans in answers:
        q = ans.question
        if q:
            max_total += q.max_marks
            if q.question_type in [QuestionType.MCQ, QuestionType.MULTI_SELECT]:
                earned, _ = evaluate_objective_answer(q, ans)
                objective_total += earned
            elif q.question_type in [QuestionType.SHORT_ANSWER, QuestionType.LONG_ANSWER]:
                # Trigger AI evaluation
                eval_res = await evaluate_subjective_answer(
                    question_content=q.content,
                    student_answer=ans.text_response or "",
                    model_answer=q.model_answer,
                    max_marks=q.max_marks,
                    rubric_criteria=q.rubric_criteria
                )
                
                # Check existing evaluation
                subj_eval_q = select(SubjectiveEvaluation).where(SubjectiveEvaluation.answer_id == ans.id)
                subj_eval = (await db.execute(subj_eval_q)).scalar_one_or_none()
                if not subj_eval:
                    subj_eval = SubjectiveEvaluation(
                        answer_id=ans.id,
                        ai_suggested_score=eval_res["suggested_score"],
                        ai_justification=eval_res["justification"],
                        ai_rubric_breakdown=eval_res["rubric_breakdown"],
                        final_examiner_score=eval_res["suggested_score"], # Pre-filled for examiner review
                        examiner_feedback="Pre-evaluated by AI Grading Engine.",
                        evaluated_at=now
                    )
                    db.add(subj_eval)
                    
    # Update or insert ExamResult
    res_query = select(ExamResult).where(ExamResult.session_id == session.id)
    res_obj = (await db.execute(res_query)).scalar_one_or_none()
    
    if not res_obj:
        res_obj = ExamResult(
            session_id=session.id,
            objective_score=max(0.0, objective_total),
            subjective_score=0.0,
            total_score=max(0.0, objective_total),
            max_possible_score=max_total,
            integrity_status=IntegrityStatus.REVIEW_REQUIRED if session.final_suspicion_score > 60 else IntegrityStatus.CLEARED,
            is_published=False,
            evaluated_at=now
        )
        db.add(res_obj)
        
    await db.commit()
    return {
        "status": "success",
        "message": "Exam successfully submitted and auto-evaluated.",
        "session_id": session.id,
        "objective_score": max(0.0, objective_total),
        "final_suspicion_score": session.final_suspicion_score
    }
