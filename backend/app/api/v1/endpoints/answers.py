import base64
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.models import User, ExamSession, StudentAnswer, SessionStatus, QuestionBank
from app.schemas.schemas import AnswerSubmitRequest, AnswerOut
from app.services.ocr_service import process_and_save_answer_image

router = APIRouter()

@router.post("/save", response_model=AnswerOut)
async def save_answer(
    req: AnswerSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify session
    sess_query = select(ExamSession).where(ExamSession.id == req.session_id)
    session = (await db.execute(sess_query)).scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != current_user.id and current_user.role == "student":
        raise HTTPException(status_code=403, detail="Unauthorized")
    if session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail=f"Cannot submit answer: Session is in {session.status} status")
        
    # Check if time expired
    now = datetime.now(timezone.utc)
    deadline = session.server_deadline
    if deadline and deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if deadline and deadline < now:
        session.status = SessionStatus.TIMED_OUT
        await db.commit()
        raise HTTPException(status_code=400, detail="Exam time has expired")

    # Fetch question to check type
    q_query = select(QuestionBank).where(QuestionBank.id == req.question_id)
    question = (await db.execute(q_query)).scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # Process image if base64 provided
    image_path = None
    ocr_text = None
    if req.image_base64:
        try:
            b64_data = req.image_base64
            if "," in b64_data:
                b64_data = b64_data.split(",", 1)[1]
            img_bytes = base64.b64decode(b64_data)
            raw_path, _, extracted_ocr = process_and_save_answer_image(img_bytes)
            image_path = raw_path
            ocr_text = extracted_ocr
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error saving image: {str(e)}")

    word_count = len(req.text_response.split()) if req.text_response else 0

    # Upsert answer
    ans_query = select(StudentAnswer).where(
        StudentAnswer.session_id == req.session_id,
        StudentAnswer.question_id == req.question_id
    )
    answer = (await db.execute(ans_query)).scalar_one_or_none()
    
    if not answer:
        answer = StudentAnswer(
            session_id=req.session_id,
            question_id=req.question_id,
            selected_option_ids=req.selected_option_ids,
            text_response=req.text_response,
            image_path=image_path,
            ocr_extracted_text=ocr_text,
            word_count=word_count,
            answered_at=now
        )
        db.add(answer)
    else:
        answer.selected_option_ids = req.selected_option_ids or answer.selected_option_ids
        answer.text_response = req.text_response if req.text_response is not None else answer.text_response
        if image_path:
            answer.image_path = image_path
            answer.ocr_extracted_text = ocr_text
        answer.word_count = word_count
        answer.answered_at = now
        
    await db.commit()
    await db.refresh(answer)
    return answer
