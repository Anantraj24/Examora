from typing import List, Dict, Any, Tuple
from app.models.models import QuestionBank, StudentAnswer, QuestionType

def evaluate_objective_answer(question: QuestionBank, answer: StudentAnswer) -> Tuple[float, Dict[str, Any]]:
    """
    Evaluates an objective answer (MCQ or Multi-Select) against correct options.
    Returns (marks_awarded, metadata).
    """
    if not answer or not answer.selected_option_ids:
        return 0.0, {"status": "unanswered", "is_correct": False}
        
    submitted_ids = set(answer.selected_option_ids)
    correct_ids = {opt.id for opt in question.options if opt.is_correct}
    
    if question.question_type == QuestionType.MCQ:
        if submitted_ids == correct_ids and len(submitted_ids) == 1:
            return question.max_marks, {
                "status": "correct",
                "is_correct": True,
                "correct_option_ids": list(correct_ids),
                "submitted_option_ids": list(submitted_ids)
            }
        else:
            deduction = -abs(question.negative_marks) if question.negative_marks else 0.0
            return deduction, {
                "status": "incorrect",
                "is_correct": False,
                "correct_option_ids": list(correct_ids),
                "submitted_option_ids": list(submitted_ids)
            }
            
    elif question.question_type == QuestionType.MULTI_SELECT:
        if submitted_ids == correct_ids:
            return question.max_marks, {
                "status": "correct",
                "is_correct": True,
                "correct_option_ids": list(correct_ids),
                "submitted_option_ids": list(submitted_ids)
            }
        # Partial credit calculation: correct selected minus incorrect selected
        correctly_picked = len(submitted_ids.intersection(correct_ids))
        incorrectly_picked = len(submitted_ids - correct_ids)
        total_correct = max(1, len(correct_ids))
        
        fraction = max(0.0, (correctly_picked - incorrectly_picked) / total_correct)
        earned = round(fraction * question.max_marks, 2)
        
        if fraction == 0.0 and question.negative_marks > 0:
            earned = -abs(question.negative_marks)
            
        return earned, {
            "status": "partial" if earned > 0 else "incorrect",
            "is_correct": earned == question.max_marks,
            "correct_option_ids": list(correct_ids),
            "submitted_option_ids": list(submitted_ids)
        }
        
    return 0.0, {"status": "unsupported_type"}
