from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user, require_role
from app.models.models import (
    User, UserRole, ExamSession, ExamResult, StudentAnswer,
    QuestionBank, QuestionOption, SubjectiveEvaluation, Exam, QuestionType
)
from app.schemas.schemas import ResultOut
from app.services.auto_grader import evaluate_objective_answer

router = APIRouter()

@router.get("/student/session/{session_id}")
async def get_student_exam_result(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns candidate scorecard with question breakdown, percentile rank,
    and examiner feedback. Notice: Proctoring suspicion scores are strictly hidden from students.
    """
    sess_query = select(ExamSession).options(
        selectinload(ExamSession.student),
        selectinload(ExamSession.exam),
        selectinload(ExamSession.result),
        selectinload(ExamSession.answers).selectinload(StudentAnswer.question).selectinload(QuestionBank.options),
        selectinload(ExamSession.answers).selectinload(StudentAnswer.evaluation)
    ).where(ExamSession.id == session_id)
    
    session = (await db.execute(sess_query)).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")
        
    if current_user.role == UserRole.STUDENT and session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this result")
        
    res = session.result
    if not res:
        raise HTTPException(status_code=400, detail="Results are still being processed")
        
    # Build question-level breakdown
    breakdown = []
    for ans in session.answers:
        q = ans.question
        if not q:
            continue
            
        item_data: Dict[str, Any] = {
            "question_id": q.id,
            "question_type": q.question_type,
            "question_content": q.content,
            "max_marks": q.max_marks,
            "negative_marks": q.negative_marks
        }
        
        if q.question_type in [QuestionType.MCQ, QuestionType.MULTI_SELECT]:
            marks_earned, eval_meta = evaluate_objective_answer(q, ans)
            item_data["marks_awarded"] = marks_earned
            item_data["status"] = eval_meta.get("status", "evaluated")
            item_data["is_correct"] = eval_meta.get("is_correct", False)
            item_data["selected_options"] = [opt.option_text for opt in q.options if opt.id in (ans.selected_option_ids or [])]
            item_data["correct_options"] = [opt.option_text for opt in q.options if opt.is_correct]
            item_data["model_answer"] = None
        else:
            ev = ans.evaluation
            item_data["marks_awarded"] = ev.final_examiner_score if (ev and ev.final_examiner_score is not None) else (ev.ai_suggested_score if ev else 0.0)
            item_data["examiner_feedback"] = ev.examiner_feedback if ev else "Awaiting feedback"
            item_data["ai_justification"] = ev.ai_justification if ev else None
            item_data["student_text"] = ans.text_response
            item_data["image_url"] = ans.image_path
            item_data["image_annotations"] = ev.image_annotations if ev else None
            item_data["model_answer"] = q.model_answer
            
        breakdown.append(item_data)
        
    pct = round((res.total_score / max(1.0, res.max_possible_score)) * 100, 1)

    # Compute dynamic cohort stats
    cohort_q = select(ExamResult).join(ExamSession, ExamResult.session_id == ExamSession.id).where(
        ExamSession.exam_id == session.exam_id
    )
    cohort_res = (await db.execute(cohort_q)).scalars().all()
    cohort_scores = [r.total_score for r in cohort_res] if cohort_res else [res.total_score]
    
    mean_val = round(sum(cohort_scores) / max(1, len(cohort_scores)), 1)
    sorted_scores = sorted(cohort_scores)
    mid = len(sorted_scores) // 2
    median_val = round((sorted_scores[mid] if len(sorted_scores) % 2 != 0 else (sorted_scores[mid - 1] + sorted_scores[mid]) / 2), 1)
    
    if len(cohort_scores) > 1:
        variance = sum((x - mean_val) ** 2 for x in cohort_scores) / (len(cohort_scores) - 1)
        stdev_val = round(variance ** 0.5, 1)
    else:
        stdev_val = 0.0

    b1 = sum(1 for s in cohort_scores if (s / max(1.0, res.max_possible_score)) <= 0.2)
    b2 = sum(1 for s in cohort_scores if 0.2 < (s / max(1.0, res.max_possible_score)) <= 0.4)
    b3 = sum(1 for s in cohort_scores if 0.4 < (s / max(1.0, res.max_possible_score)) <= 0.6)
    b4 = sum(1 for s in cohort_scores if 0.6 < (s / max(1.0, res.max_possible_score)) <= 0.8)
    b5 = sum(1 for s in cohort_scores if (s / max(1.0, res.max_possible_score)) > 0.8)

    cohort_stats = {
        "mean": mean_val,
        "median": median_val,
        "standard_deviation": stdev_val,
        "distribution": [
            {"bracket": "0-20%", "count": b1},
            {"bracket": "21-40%", "count": b2},
            {"bracket": "41-60%", "count": b3},
            {"bracket": "61-80%", "count": b4},
            {"bracket": "81-100%", "count": b5},
        ]
    }
    
    return {
        "session_id": session.id,
        "student_name": session.student.full_name if session.student else "Candidate",
        "exam_title": session.exam.title if session.exam else "Examination",
        "objective_score": res.objective_score,
        "subjective_score": res.subjective_score,
        "total_score": res.total_score,
        "max_possible_score": res.max_possible_score,
        "percentage": pct,
        "percentile": res.percentile,
        "is_published": res.is_published,
        "evaluated_at": res.evaluated_at,
        "cohort_stats": cohort_stats,
        "question_breakdown": breakdown
    }

@router.get("/cohort-analytics/{exam_id}")
async def get_cohort_analytics(
    exam_id: str,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns analytics across an entire exam cohort for Examiners & Admins.
    """
    query = select(ExamResult).join(ExamSession, ExamResult.session_id == ExamSession.id).where(
        ExamSession.exam_id == exam_id
    )
    results = (await db.execute(query)).scalars().all()
    
    if not results:
        return {
            "total_candidates": 0,
            "average_score": 0.0,
            "highest_score": 0.0,
            "lowest_score": 0.0,
            "score_distribution": {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
        }
        
    scores = [r.total_score for r in results]
    dist = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    
    for r in results:
        pct = (r.total_score / max(1.0, r.max_possible_score)) * 100
        if pct <= 20: dist["0-20"] += 1
        elif pct <= 40: dist["21-40"] += 1
        elif pct <= 60: dist["41-60"] += 1
        elif pct <= 80: dist["61-80"] += 1
        else: dist["81-100"] += 1
        
    return {
        "total_candidates": len(results),
        "average_score": round(sum(scores) / len(scores), 2),
        "highest_score": max(scores),
        "lowest_score": min(scores),
        "score_distribution": dist
    }
