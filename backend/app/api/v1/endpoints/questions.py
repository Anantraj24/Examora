from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user, require_role
from app.models.models import User, UserRole, QuestionBank, QuestionOption, QuestionType
from app.schemas.schemas import QuestionCreate, QuestionUpdate, QuestionOut

router = APIRouter()

@router.post("/", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
async def create_question(
    question_in: QuestionCreate,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    # Validation: MCQ must have at least 2 options and exactly 1 correct option
    if question_in.question_type == QuestionType.MCQ:
        if not question_in.options or len(question_in.options) < 2:
            raise HTTPException(status_code=400, detail="MCQ questions must have at least 2 options")
        correct_count = sum(1 for opt in question_in.options if opt.is_correct)
        if correct_count != 1:
            raise HTTPException(status_code=400, detail="MCQ questions must have exactly 1 correct option")
            
    # Validation: Image upload & subjective questions must specify max marks > 0
    if question_in.max_marks <= 0:
        raise HTTPException(status_code=400, detail="Max marks must be greater than 0")

    question = QuestionBank(
        subject=question_in.subject,
        topic=question_in.topic,
        question_type=question_in.question_type,
        difficulty=question_in.difficulty,
        content=question_in.content,
        model_answer=question_in.model_answer,
        rubric_criteria=question_in.rubric_criteria,
        max_marks=question_in.max_marks,
        negative_marks=question_in.negative_marks,
        created_by=current_user.id
    )
    db.add(question)
    await db.flush()
    
    if question_in.options:
        for idx, opt_data in enumerate(question_in.options):
            option = QuestionOption(
                question_id=question.id,
                option_text=opt_data.option_text,
                is_correct=opt_data.is_correct,
                sort_order=opt_data.sort_order or idx
            )
            db.add(option)
            
    await db.commit()
    await db.refresh(question)
    return question

@router.get("/", response_model=List[QuestionOut])
async def list_questions(
    q: Optional[str] = Query(None, description="Search keyword in question content, topic, subject, or model answer"),
    search: Optional[str] = Query(None, description="Alternative alias for search query"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    question_type: Optional[str] = Query(None, description="Filter by question type (e.g. MCQ)"),
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    query = select(QuestionBank).options(selectinload(QuestionBank.options))
    
    # Search keyword filtering (case-insensitive)
    search_term = q or search
    if search_term and search_term.strip():
        term = f"%{search_term.strip()}%"
        query = query.where(
            or_(
                QuestionBank.content.ilike(term),
                QuestionBank.topic.ilike(term),
                QuestionBank.subject.ilike(term),
                QuestionBank.model_answer.ilike(term)
            )
        )

    # Subject filtering (case-insensitive)
    if subject and subject.strip() and subject.strip().lower() not in ('all', 'all subjects'):
        query = query.where(QuestionBank.subject.ilike(f"%{subject.strip()}%"))

    # Difficulty filtering
    if difficulty and difficulty.strip() and difficulty.strip().lower() != 'all':
        query = query.where(QuestionBank.difficulty == difficulty.strip().lower())

    # Question Type filtering (e.g. MCQ)
    if question_type and question_type.strip() and question_type.strip().lower() != 'all':
        query = query.where(QuestionBank.question_type == question_type.strip())
        
    query = query.order_by(QuestionBank.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{question_id}", response_model=QuestionOut)
async def get_question(
    question_id: str,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    query = select(QuestionBank).options(selectinload(QuestionBank.options)).where(QuestionBank.id == question_id)
    result = await db.execute(query)
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: str,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    query = select(QuestionBank).where(QuestionBank.id == question_id)
    result = await db.execute(query)
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(question)
    await db.commit()
    return None
