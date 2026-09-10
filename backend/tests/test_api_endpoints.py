import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_full_api_lifecycle(client: AsyncClient):
    # 1. Register Examiner & Student
    reg_examiner = await client.post("/api/v1/auth/register", json={
        "email": "prof_test@exam.io",
        "password": "password123",
        "full_name": "Prof Test",
        "role": "examiner"
    })
    assert reg_examiner.status_code == 201
    
    reg_student = await client.post("/api/v1/auth/register", json={
        "email": "student_test@exam.io",
        "password": "password123",
        "full_name": "Student Test",
        "role": "student"
    })
    assert reg_student.status_code == 201

    # 2. Login Examiner
    login_ex = await client.post("/api/v1/auth/login", json={
        "email": "prof_test@exam.io",
        "password": "password123"
    })
    assert login_ex.status_code == 200
    ex_token = login_ex.json()["access_token"]
    ex_headers = {"Authorization": f"Bearer {ex_token}"}

    # 3. Create MCQ Question
    q_mcq_resp = await client.post("/api/v1/questions/", json={
        "subject": "CS",
        "topic": "Algorithms",
        "question_type": "MCQ",
        "difficulty": "easy",
        "content": "What is time complexity of Binary Search?",
        "max_marks": 2.0,
        "negative_marks": 0.5,
        "options": [
            {"option_text": "O(log n)", "is_correct": True, "sort_order": 0},
            {"option_text": "O(n)", "is_correct": False, "sort_order": 1}
        ]
    }, headers=ex_headers)
    assert q_mcq_resp.status_code == 201
    mcq_id = q_mcq_resp.json()["id"]
    correct_opt_id = [opt["id"] for opt in q_mcq_resp.json()["options"] if opt["is_correct"]][0]

    # 4. Create Subjective Question
    q_subj_resp = await client.post("/api/v1/questions/", json={
        "subject": "CS",
        "topic": "Algorithms",
        "question_type": "short_answer",
        "difficulty": "medium",
        "content": "Describe Divide and Conquer strategy.",
        "model_answer": "Divide into subproblems, conquer recursively, combine solutions.",
        "max_marks": 5.0,
        "negative_marks": 0.0
    }, headers=ex_headers)
    assert q_subj_resp.status_code == 201
    subj_id = q_subj_resp.json()["id"]

    # 5. Create and Publish Exam
    exam_resp = await client.post("/api/v1/exams/", json={
        "title": "CS Midterm 2026",
        "subject": "CS",
        "instructions": "Attempt all questions.",
        "duration_minutes": 30,
        "is_published": True,
        "question_ids": [mcq_id, subj_id]
    }, headers=ex_headers)
    assert exam_resp.status_code == 201
    exam_id = exam_resp.json()["id"]

    # 6. Login Student
    login_st = await client.post("/api/v1/auth/login", json={
        "email": "student_test@exam.io",
        "password": "password123"
    })
    assert login_st.status_code == 200
    st_token = login_st.json()["access_token"]
    st_headers = {"Authorization": f"Bearer {st_token}"}

    # 7. Student Starts Exam Session
    start_resp = await client.post("/api/v1/sessions/start", json={"exam_id": exam_id}, headers=st_headers)
    assert start_resp.status_code == 200
    paper_data = start_resp.json()
    session_id = paper_data["session_id"]
    assert len(paper_data["questions"]) == 2

    # 8. Student Submits MCQ Answer
    ans_mcq_resp = await client.post("/api/v1/answers/save", json={
        "session_id": session_id,
        "question_id": mcq_id,
        "selected_option_ids": [correct_opt_id]
    }, headers=st_headers)
    assert ans_mcq_resp.status_code == 200

    # 9. Student Submits Subjective Answer
    ans_subj_resp = await client.post("/api/v1/answers/save", json={
        "session_id": session_id,
        "question_id": subj_id,
        "text_response": "Divide problem into smaller parts, conquer recursively and combine solutions."
    }, headers=st_headers)
    assert ans_subj_resp.status_code == 200

    # 10. Student Finalizes Submission
    submit_resp = await client.post(f"/api/v1/sessions/submit-final/{session_id}", headers=st_headers)
    assert submit_resp.status_code == 200
    assert submit_resp.json()["objective_score"] == 2.0

    # 11. Examiner Checks Grading Queue
    queue_resp = await client.get("/api/v1/evaluations/queue", headers=ex_headers)
    assert queue_resp.status_code == 200
    queue = queue_resp.json()
    assert len(queue) >= 1
    answer_id = queue[0]["answer_id"]
    assert queue[0]["ai_suggested_score"] > 0

    # 12. Examiner Overrides / Approves Grade
    grade_resp = await client.post("/api/v1/evaluations/submit-grade", json={
        "answer_id": answer_id,
        "final_score": 4.5,
        "examiner_feedback": "Excellent conceptual explanation."
    }, headers=ex_headers)
    assert grade_resp.status_code == 200

    # 13. Examiner Publishes Results
    pub_resp = await client.post(f"/api/v1/evaluations/publish-results/{exam_id}", headers=ex_headers)
    assert pub_resp.status_code == 200

    # 14. Student Views Result Scorecard
    res_resp = await client.get(f"/api/v1/results/student/session/{session_id}", headers=st_headers)
    assert res_resp.status_code == 200
    res_data = res_resp.json()
    assert res_data["total_score"] == 6.5  # 2.0 (MCQ) + 4.5 (Subjective)
    assert res_data["is_published"] is True

@pytest.mark.asyncio
async def test_question_and_exam_validation_constraints(client: AsyncClient):
    # Register & login examiner
    await client.post("/api/v1/auth/register", json={
        "email": "examiner_val@exam.io",
        "password": "password123",
        "full_name": "Val Examiner",
        "role": "examiner"
    })
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "examiner_val@exam.io",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Reject MCQ with no correct options
    resp_no_corr = await client.post("/api/v1/questions/", json={
        "subject": "Math",
        "topic": "Calculus",
        "question_type": "MCQ",
        "difficulty": "easy",
        "content": "What is derivative of x^2?",
        "max_marks": 2.0,
        "options": [
            {"option_text": "x", "is_correct": False},
            {"option_text": "3x", "is_correct": False}
        ]
    }, headers=headers)
    assert resp_no_corr.status_code == 400
    assert "exactly 1 correct option" in resp_no_corr.json()["detail"]

    # 2. Reject MCQ with multiple correct options
    resp_multi_corr = await client.post("/api/v1/questions/", json={
        "subject": "Math",
        "topic": "Calculus",
        "question_type": "MCQ",
        "difficulty": "easy",
        "content": "What is derivative of x^2?",
        "max_marks": 2.0,
        "options": [
            {"option_text": "2x", "is_correct": True},
            {"option_text": "2*x", "is_correct": True}
        ]
    }, headers=headers)
    assert resp_multi_corr.status_code == 400
    assert "exactly 1 correct option" in resp_multi_corr.json()["detail"]

    # 3. Reject Question with non-positive marks
    resp_zero_marks = await client.post("/api/v1/questions/", json={
        "subject": "Math",
        "topic": "Calculus",
        "question_type": "short_answer",
        "difficulty": "easy",
        "content": "Explain limits",
        "max_marks": 0.0
    }, headers=headers)
    assert resp_zero_marks.status_code == 400
    assert "Max marks must be greater than 0" in resp_zero_marks.json()["detail"]

    # 4. Reject Exam with non-positive duration
    resp_invalid_dur = await client.post("/api/v1/exams/", json={
        "title": "Invalid Exam",
        "subject": "Math",
        "instructions": "N/A",
        "duration_minutes": 0
    }, headers=headers)
    assert resp_invalid_dur.status_code == 400
    assert "Duration must be positive" in resp_invalid_dur.json()["detail"]

