from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user, require_role
from app.models.models import User, UserRole, Exam, ExamQuestion, QuestionBank
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
    
    out_list = []
    for ex in exams:
        out = ExamOut.model_validate(ex)
        out.total_questions = len(ex.questions) if ex.questions else 0
        out.total_marks = sum(eq.question.max_marks for eq in ex.questions if eq.question) if ex.questions else 0.0
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
    return out

@router.put("/{exam_id}/publish", response_model=ExamOut)
async def publish_exam(
    exam_id: str,
    is_published: bool = Query(True),
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    exam.is_published = is_published
    await db.commit()
    await db.refresh(exam)
    return exam
