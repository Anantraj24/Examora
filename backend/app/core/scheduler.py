import asyncio
import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.models import ExamSession, SessionStatus, QuestionBank, StudentAnswer, ExamResult, IntegrityStatus, QuestionType
from app.services.auto_grader import evaluate_objective_answer

logger = logging.getLogger("exam_scheduler")
scheduler = AsyncIOScheduler()

async def check_and_auto_submit_expired_sessions():
    """
    Background job running every 10 seconds:
    Scans all IN_PROGRESS exam sessions. If server_deadline <= now,
    it automatically auto-submits the exam and triggers objective evaluation.
    """
    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as db:
        try:
            query = select(ExamSession).where(
                ExamSession.status == SessionStatus.IN_PROGRESS,
                ExamSession.server_deadline <= now
            )
            result = await db.execute(query)
            expired_sessions = result.scalars().all()
            
            for session in expired_sessions:
                logger.info(f"Auto-submitting expired exam session: {session.id} for student {session.student_id}")
                session.status = SessionStatus.TIMED_OUT
                session.submitted_at = now
                
                # Fetch answers for this session
                ans_query = select(StudentAnswer).where(StudentAnswer.session_id == session.id)
                ans_res = await db.execute(ans_query)
                answers = ans_res.scalars().all()
                
                objective_score = 0.0
                max_score = 0.0
                
                for ans in answers:
                    q_res = await db.execute(select(QuestionBank).where(QuestionBank.id == ans.question_id))
                    q = q_res.scalar_one_or_none()
                    if q:
                        max_score += q.max_marks
                        if q.question_type in [QuestionType.MCQ, QuestionType.MULTI_SELECT]:
                            earned, _ = evaluate_objective_answer(q, ans)
                            objective_score += earned
                            
                # Check or create ExamResult
                res_query = select(ExamResult).where(ExamResult.session_id == session.id)
                res_obj = (await db.execute(res_query)).scalar_one_or_none()
                
                if not res_obj:
                    res_obj = ExamResult(
                        session_id=session.id,
                        objective_score=max(0.0, objective_score),
                        subjective_score=0.0,
                        total_score=max(0.0, objective_score),
                        max_possible_score=max_score,
                        integrity_status=IntegrityStatus.REVIEW_REQUIRED if session.final_suspicion_score > 60 else IntegrityStatus.CLEARED,
                        is_published=False,
                        evaluated_at=now
                    )
                    db.add(res_obj)
                    
            await db.commit()
        except Exception as e:
            logger.error(f"Error in check_and_auto_submit_expired_sessions: {e}")

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(check_and_auto_submit_expired_sessions, "interval", seconds=10, id="auto_submit_checker")
        scheduler.start()
        logger.info("APScheduler initialized: Auto-submit checker is active.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler shutdown complete.")
