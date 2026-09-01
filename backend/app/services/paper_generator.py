import hashlib
import random
from typing import List, Dict, Any
from app.models.models import QuestionBank, QuestionOption, Exam

def get_student_exam_seed(exam_id: str, student_id: str) -> int:
    seed_str = f"{exam_id}:{student_id}"
    return int(hashlib.sha256(seed_str.encode("utf-8")).hexdigest()[:8], 16)

def generate_randomized_paper(
    exam: Exam, 
    all_questions: List[QuestionBank], 
    student_id: str
) -> List[Dict[str, Any]]:
    """
    Deterministically generates a randomized question set and option ordering 
    for a specific student taking an exam. If the student refreshes or reconnects,
    the exact same ordering is reproduced.
    """
    seed_value = get_student_exam_seed(exam.id, student_id)
    rng = random.Random(seed_value)
    
    selected_questions = list(all_questions)
    
    # If exam has blueprint rules (e.g. { "easy": 2, "medium": 3, "hard": 1 }), filter accordingly
    blueprint = exam.blueprint_rules or {}
    if "easy_count" in blueprint or "medium_count" in blueprint or "hard_count" in blueprint:
        easy_pool = [q for q in all_questions if q.difficulty == "easy"]
        med_pool = [q for q in all_questions if q.difficulty == "medium"]
        hard_pool = [q for q in all_questions if q.difficulty == "hard"]
        
        selected_questions = []
        if "easy_count" in blueprint:
            rng.shuffle(easy_pool)
            selected_questions.extend(easy_pool[:blueprint["easy_count"]])
        if "medium_count" in blueprint:
            rng.shuffle(med_pool)
            selected_questions.extend(med_pool[:blueprint["medium_count"]])
        if "hard_count" in blueprint:
            rng.shuffle(hard_pool)
            selected_questions.extend(hard_pool[:blueprint["hard_count"]])
            
        # Fallback if pools were insufficient
        if not selected_questions:
            selected_questions = list(all_questions)
    
    # Shuffle question sequence deterministically
    rng.shuffle(selected_questions)
    
    paper_views = []
    for idx, q in enumerate(selected_questions):
        # Permute options deterministically for MCQ & Multi-Select
        shuffled_options = []
        if q.options:
            opts = list(q.options)
            rng.shuffle(opts)
            for opt in opts:
                shuffled_options.append({
                    "id": opt.id,
                    "option_text": opt.option_text,
                    "sort_order": opt.sort_order
                })
        
        paper_views.append({
            "id": q.id,
            "order_index": idx + 1,
            "question_type": q.question_type,
            "difficulty": q.difficulty,
            "content": q.content,
            "max_marks": q.max_marks,
            "negative_marks": q.negative_marks,
            "options": shuffled_options
        })
        
    return paper_views
