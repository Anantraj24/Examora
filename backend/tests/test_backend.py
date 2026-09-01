import pytest
from app.services.paper_generator import get_student_exam_seed, generate_randomized_paper
from app.services.auto_grader import evaluate_objective_answer
from app.services.proctor_scorer import compute_telemetry_suspicion
from app.services.llm_evaluator import _heuristic_semantic_grade
from app.models.models import QuestionBank, QuestionOption, Exam, StudentAnswer, QuestionType, DifficultyLevel
from app.schemas.schemas import ProctorTelemetryPayload

# 1. Deterministic Randomizer Tests
def test_deterministic_seed():
    seed1 = get_student_exam_seed("exam-123", "student-456")
    seed2 = get_student_exam_seed("exam-123", "student-456")
    seed3 = get_student_exam_seed("exam-123", "student-789")
    
    assert seed1 == seed2, "Same student and exam must yield identical seed"
    assert seed1 != seed3, "Different student must yield different seed"

def test_paper_generator_determinism():
    exam = Exam(id="exam-100", title="Test Exam", blueprint_rules=None)
    q1 = QuestionBank(id="q1", question_type="MCQ", difficulty="easy", content="Q1", max_marks=2.0, negative_marks=0.5)
    q2 = QuestionBank(id="q2", question_type="MCQ", difficulty="medium", content="Q2", max_marks=2.0, negative_marks=0.5)
    q3 = QuestionBank(id="q3", question_type="short_answer", difficulty="hard", content="Q3", max_marks=5.0, negative_marks=0.0)
    
    q1.options = [
        QuestionOption(id="opt1", question_id="q1", option_text="A", is_correct=True),
        QuestionOption(id="opt2", question_id="q1", option_text="B", is_correct=False)
    ]
    q2.options = [
        QuestionOption(id="opt3", question_id="q2", option_text="C", is_correct=True),
        QuestionOption(id="opt4", question_id="q2", option_text="D", is_correct=False)
    ]
    q3.options = []
    
    all_q = [q1, q2, q3]
    
    paper_run_1 = generate_randomized_paper(exam, all_q, "student-001")
    paper_run_2 = generate_randomized_paper(exam, all_q, "student-001")
    
    # Assert run 1 and run 2 are strictly identical
    assert [q["id"] for q in paper_run_1] == [q["id"] for q in paper_run_2]
    assert [o["id"] for o in paper_run_1[0]["options"]] == [o["id"] for o in paper_run_2[0]["options"]]

# 2. Objective Auto-Grader Tests
def test_auto_grader_mcq_correct():
    q = QuestionBank(id="q1", question_type=QuestionType.MCQ, max_marks=3.0, negative_marks=1.0)
    q.options = [
        QuestionOption(id="opt1", is_correct=True),
        QuestionOption(id="opt2", is_correct=False)
    ]
    ans = StudentAnswer(question_id="q1", selected_option_ids=["opt1"])
    earned, meta = evaluate_objective_answer(q, ans)
    assert earned == 3.0
    assert meta["is_correct"] is True

def test_auto_grader_mcq_negative_marking():
    q = QuestionBank(id="q1", question_type=QuestionType.MCQ, max_marks=3.0, negative_marks=1.0)
    q.options = [
        QuestionOption(id="opt1", is_correct=True),
        QuestionOption(id="opt2", is_correct=False)
    ]
    ans = StudentAnswer(question_id="q1", selected_option_ids=["opt2"])
    earned, meta = evaluate_objective_answer(q, ans)
    assert earned == -1.0
    assert meta["is_correct"] is False

# 3. Proctor Suspicion Engine Tests
def test_proctor_telemetry_scoring():
    # Test face absence
    payload_no_face = ProctorTelemetryPayload(
        session_id="sess-1",
        face_detected=False,
        face_count=0
    )
    score, tabs, events, _ = compute_telemetry_suspicion(payload_no_face, current_score=0.0, current_tab_switches=0)
    assert score > 0.0
    assert any(e["event_type"] == "FACE_ABSENT" for e in events)

    # Test multi-face
    payload_multi = ProctorTelemetryPayload(
        session_id="sess-1",
        face_detected=True,
        face_count=2
    )
    score_multi, _, events_multi, _ = compute_telemetry_suspicion(payload_multi, current_score=10.0, current_tab_switches=0)
    assert score_multi >= 35.0
    assert any(e["event_type"] == "MULTI_FACE" for e in events_multi)

    # Test tab switch
    payload_tab = ProctorTelemetryPayload(
        session_id="sess-1",
        face_detected=True,
        face_count=1,
        tab_hidden=True
    )
    score_tab, tabs_tab, events_tab, _ = compute_telemetry_suspicion(payload_tab, current_score=0.0, current_tab_switches=0)
    assert tabs_tab == 1
    assert any(e["event_type"] == "TAB_BLUR" for e in events_tab)

# 4. Semantic LLM Fallback Evaluator Tests
def test_semantic_grader_concept_matching():
    student_ans = "Paging divides virtual memory into fixed physical frames eliminating external fragmentation."
    model_ans = "Paging uses fixed-size memory frames and pages to eliminate external fragmentation."
    
    result = _heuristic_semantic_grade(
        student_answer=student_ans,
        model_answer=model_ans,
        max_marks=5.0
    )
    
    assert result["suggested_score"] > 2.5
    assert "paging" in result["rubric_breakdown"]["key_concepts_matched"]
    assert "frames" in result["rubric_breakdown"]["key_concepts_matched"]
