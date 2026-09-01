from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user, require_role
from app.models.models import (
    User, UserRole, StudentAnswer, SubjectiveEvaluation, QuestionBank,
    ExamSession, ExamResult, QuestionType, Exam
)
from app.schemas.schemas import SubjectiveGradingItem, ExaminerGradeSubmit

router = APIRouter()

@router.get("/queue", response_model=List[SubjectiveGradingItem])
async def get_examiner_grading_queue(
    exam_id: Optional[str] = Query(None),
    question_id: Optional[str] = Query(None),
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns grading queue for subjective and handwritten answers,
    with AI suggested pre-grades and rubric breakdowns.
    """
    query = select(StudentAnswer).options(
        selectinload(StudentAnswer.question).selectinload(QuestionBank.options),
        selectinload(StudentAnswer.session).selectinload(ExamSession.student),
        selectinload(StudentAnswer.session).selectinload(ExamSession.exam),
        selectinload(StudentAnswer.evaluation)
    ).join(QuestionBank, StudentAnswer.question_id == QuestionBank.id).where(
        QuestionBank.question_type.in_([
            QuestionType.SHORT_ANSWER, QuestionType.LONG_ANSWER, QuestionType.IMAGE_UPLOAD
        ])
    )
    
    if question_id:
        query = query.where(StudentAnswer.question_id == question_id)
        
    result = await db.execute(query)
    answers = result.scalars().all()
    
    queue_items = []
    for ans in answers:
        if exam_id and ans.session.exam_id != exam_id:
            continue
            
        q = ans.question
        s = ans.session
        ev = ans.evaluation
        
        queue_items.append(SubjectiveGradingItem(
            answer_id=ans.id,
            student_id=s.student_id if s else "",
            student_name=s.student.full_name if (s and s.student) else "Student",
            question_id=q.id if q else "",
            question_content=q.content if q else "",
            question_type=q.question_type if q else "",
            max_marks=q.max_marks if q else 1.0,
            model_answer=q.model_answer if q else None,
            rubric_criteria=q.rubric_criteria if q else None,
            student_text=ans.text_response,
            image_url=ans.image_path,
            ocr_text=ans.ocr_extracted_text,
            ai_suggested_score=ev.ai_suggested_score if ev else 0.0,
            ai_justification=ev.ai_justification if ev else "Awaiting AI evaluation",
            ai_rubric_breakdown=ev.ai_rubric_breakdown if ev else None,
            final_examiner_score=ev.final_examiner_score if ev else (ev.ai_suggested_score if ev else None),
            examiner_feedback=ev.examiner_feedback if ev else None,
            image_annotations=ev.image_annotations if ev else None
        ))
        
    return queue_items

@router.post("/submit-grade")
async def submit_examiner_grade(
    grade_in: ExaminerGradeSubmit,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    ans_query = select(StudentAnswer).options(
        selectinload(StudentAnswer.session),
        selectinload(StudentAnswer.evaluation),
        selectinload(StudentAnswer.question)
    ).where(StudentAnswer.id == grade_in.answer_id)
    
    ans = (await db.execute(ans_query)).scalar_one_or_none()
    if not ans:
        raise HTTPException(status_code=404, detail="Student answer not found")
        
    now = datetime.now(timezone.utc)
    ev = ans.evaluation
    
    if not ev:
        ev = SubjectiveEvaluation(
            answer_id=ans.id,
            ai_suggested_score=grade_in.final_score,
            ai_justification="Directly evaluated by Examiner",
            final_examiner_score=grade_in.final_score,
            examiner_feedback=grade_in.examiner_feedback,
            image_annotations=grade_in.image_annotations,
            evaluated_by=current_user.id,
            evaluated_at=now
        )
        db.add(ev)
    else:
        ev.final_examiner_score = grade_in.final_score
        ev.examiner_feedback = grade_in.examiner_feedback
        if grade_in.image_annotations is not None:
            ev.image_annotations = grade_in.image_annotations
        ev.evaluated_by = current_user.id
        ev.evaluated_at = now
        
    await db.flush()
    
    # Recalculate ExamResult subjective score
    session_id = ans.session_id
    res_query = select(ExamResult).where(ExamResult.session_id == session_id)
    res_obj = (await db.execute(res_query)).scalar_one_or_none()
    
    if res_obj:
        # Sum all subjective answers for this session
        all_ans_q = select(StudentAnswer).options(selectinload(StudentAnswer.evaluation)).where(StudentAnswer.session_id == session_id)
        all_answers = (await db.execute(all_ans_q)).scalars().all()
        
        subj_total = 0.0
        for a in all_answers:
            if a.evaluation and a.evaluation.final_examiner_score is not None:
                subj_total += a.evaluation.final_examiner_score
                
        res_obj.subjective_score = subj_total
        res_obj.total_score = res_obj.objective_score + subj_total
        
    await db.commit()
    return {"status": "success", "message": "Grade recorded successfully", "answer_id": ans.id}

@router.post("/publish-results/{exam_id}")
async def publish_exam_results(
    exam_id: str,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Computes cohort percentiles and publishes final grades for all submitted exam sessions.
    """
    query = select(ExamResult).join(ExamSession, ExamResult.session_id == ExamSession.id).where(
        ExamSession.exam_id == exam_id
    )
    results = (await db.execute(query)).scalars().all()
    
    if not results:
        return {"status": "success", "message": "No results found for this exam", "published_count": 0}
        
    # Calculate cohort percentiles
    scores = sorted([r.total_score for r in results])
    n = len(scores)
    
    for r in results:
        # Percentile rank = (count of scores strictly less than score / N) * 100
        count_less = sum(1 for s in scores if s < r.total_score)
        pct = round((count_less / max(1, n)) * 100, 1)
        r.percentile = pct
        r.is_published = True
        
    await db.commit()
    return {"status": "success", "message": f"Published results for {len(results)} candidates", "published_count": len(results)}
