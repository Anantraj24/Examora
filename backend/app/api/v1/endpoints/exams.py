from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user, require_role
from app.models.models import User, UserRole, Exam, ExamQuestion, QuestionBank, ExamSession, SessionStatus
from app.schemas.schemas import ExamCreate, ExamUpdate, ExamOut

router = APIRouter()

@router.post("/", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam_in: ExamCreate,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    if exam_in.duration_minutes <= 0:
        raise HTTPException(status_code=400, detail="Duration must be positive")
        
    exam = Exam(
        title=exam_in.title,
        subject=exam_in.subject,
        instructions=exam_in.instructions,
        duration_minutes=exam_in.duration_minutes,
        start_window=exam_in.start_window,
        end_window=exam_in.end_window,
        blueprint_rules=exam_in.blueprint_rules or {
            "easy_count": 5, "medium_count": 5, "hard_count": 2
        },
        proctoring_config=exam_in.proctoring_config or {
            "webcam_required": True,
            "gaze_tracking": True,
            "multi_face_detection": True,
            "max_tab_switches": 3,
            "gaze_sensitivity": 0.35
        },
        is_published=exam_in.is_published,
        created_by=current_user.id
    )
    db.add(exam)
    await db.flush()
    
    # Associate explicit question IDs if provided
    total_marks = 0.0
    if exam_in.question_ids:
        for idx, q_id in enumerate(exam_in.question_ids):
            q_res = await db.execute(select(QuestionBank).where(QuestionBank.id == q_id))
            q = q_res.scalar_one_or_none()
            if q:
                total_marks += q.max_marks
                eq = ExamQuestion(exam_id=exam.id, question_id=q_id, order_index=idx)
                db.add(eq)
                
    await db.commit()
    await db.refresh(exam)
    
    exam_out = ExamOut.model_validate(exam)
    exam_out.total_questions = len(exam_in.question_ids) if exam_in.question_ids else 0
    exam_out.total_marks = total_marks
    return exam_out

@router.get("/", response_model=List[ExamOut])
async def list_exams(
    published_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Exam).options(selectinload(Exam.questions).selectinload(ExamQuestion.question))
    if current_user.role == UserRole.STUDENT or published_only:
        query = query.where(Exam.is_published == True)
        
    result = await db.execute(query)
    exams = result.scalars().all()

    student_sessions_map = {}
    if current_user.role == UserRole.STUDENT and exams:
        exam_ids = [ex.id for ex in exams]
        sess_query = select(ExamSession).where(
            ExamSession.student_id == current_user.id,
            ExamSession.exam_id.in_(exam_ids)
        )
        sess_res = await db.execute(sess_query)
        for s in sess_res.scalars().all():
            student_sessions_map[s.exam_id] = s
    
    out_list = []
    for ex in exams:
        out = ExamOut.model_validate(ex)
        out.total_questions = len(ex.questions) if ex.questions else 0
        out.total_marks = sum(eq.question.max_marks for eq in ex.questions if eq.question) if ex.questions else 0.0
        
        if current_user.role == UserRole.STUDENT:
            s = student_sessions_map.get(ex.id)
            if s:
                out.student_session_id = s.id
                status_str = (s.status.value if hasattr(s.status, 'value') else str(s.status)).lower()
                out.student_session_status = status_str
                out.is_completed = (s.status in [SessionStatus.SUBMITTED, SessionStatus.TIMED_OUT, SessionStatus.DISQUALIFIED])
            else:
                out.student_session_status = "not_started"
                out.is_completed = False
        out_list.append(out)
        
    return out_list

@router.get("/{exam_id}", response_model=ExamOut)
async def get_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Exam).options(
        selectinload(Exam.questions).selectinload(ExamQuestion.question)
    ).where(Exam.id == exam_id)
    
    result = await db.execute(query)
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    out = ExamOut.model_validate(exam)
    out.total_questions = len(exam.questions) if exam.questions else 0
    out.total_marks = sum(eq.question.max_marks for eq in exam.questions if eq.question) if exam.questions else 0.0

    if current_user.role == UserRole.STUDENT:
        sess_query = select(ExamSession).where(
            ExamSession.exam_id == exam.id,
            ExamSession.student_id == current_user.id
        )
        s = (await db.execute(sess_query)).scalar_one_or_none()
        if s:
            out.student_session_id = s.id
            status_str = (s.status.value if hasattr(s.status, 'value') else str(s.status)).lower()
            out.student_session_status = status_str
            out.is_completed = (s.status in [SessionStatus.SUBMITTED, SessionStatus.TIMED_OUT, SessionStatus.DISQUALIFIED])
        else:
            out.student_session_status = "not_started"
            out.is_completed = False

    return out

@router.put("/{exam_id}", response_model=ExamOut)
async def update_exam(
    exam_id: str,
    exam_in: ExamUpdate,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Exam).options(
        selectinload(Exam.questions).selectinload(ExamQuestion.question)
    ).where(Exam.id == exam_id)
    result = await db.execute(query)
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    update_data = exam_in.model_dump(exclude_unset=True)
    
    # Handle duration check if provided
    if "duration_minutes" in update_data and update_data["duration_minutes"] is not None:
        if update_data["duration_minutes"] <= 0:
            raise HTTPException(status_code=400, detail="Duration must be positive")
            
    # Handle questions update if provided
    if "question_ids" in update_data:
        question_ids = update_data.pop("question_ids")
        if question_ids is not None:
            exam.questions.clear()
            await db.flush()
            for idx, q_id in enumerate(question_ids):
                q_res = await db.execute(select(QuestionBank).where(QuestionBank.id == q_id))
                q = q_res.scalar_one_or_none()
                if q:
                    eq = ExamQuestion(exam_id=exam.id, question_id=q_id, order_index=idx)
                    db.add(eq)
                    
    for field, value in update_data.items():
        setattr(exam, field, value)
        
    await db.commit()
    
    # Re-query with updated relationships
    re_query = select(Exam).options(
        selectinload(Exam.questions).selectinload(ExamQuestion.question)
    ).where(Exam.id == exam_id)
    refreshed = (await db.execute(re_query)).scalar_one()
    
    out = ExamOut.model_validate(refreshed)
    out.total_questions = len(refreshed.questions) if refreshed.questions else 0
    out.total_marks = sum(eq.question.max_marks for eq in refreshed.questions if eq.question) if refreshed.questions else 0.0
    return out

@router.delete("/{exam_id}", status_code=status.HTTP_200_OK)
async def delete_exam(
    exam_id: str,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    await db.delete(exam)
    await db.commit()
    return {"message": "Exam deleted successfully", "id": exam_id}

@router.put("/{exam_id}/publish", response_model=ExamOut)
async def publish_exam(
    exam_id: str,
    is_published: bool = Query(True),
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Exam).options(
        selectinload(Exam.questions).selectinload(ExamQuestion.question)
    ).where(Exam.id == exam_id)
    result = await db.execute(query)
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    exam.is_published = is_published
    await db.commit()
    await db.refresh(exam)
    
    out = ExamOut.model_validate(exam)
    out.total_questions = len(exam.questions) if exam.questions else 0
    out.total_marks = sum(eq.question.max_marks for eq in exam.questions if eq.question) if exam.questions else 0.0
    return out

