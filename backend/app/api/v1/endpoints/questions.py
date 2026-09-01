from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
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
    subject: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    question_type: Optional[str] = Query(None),
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    query = select(QuestionBank).options(selectinload(QuestionBank.options))
    if subject:
        query = query.where(QuestionBank.subject == subject)
    if difficulty:
        query = query.where(QuestionBank.difficulty == difficulty)
    if question_type:
        query = query.where(QuestionBank.question_type == question_type)
        
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
