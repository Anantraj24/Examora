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


@pytest.mark.asyncio
async def test_proctoring_telemetry_and_live_overview(client: AsyncClient):
    # Register & Login
    await client.post("/api/v1/auth/register", json={
        "email": "proctor_student@exam.io",
        "password": "password123",
        "full_name": "Proctor Candidate",
        "role": "student"
    })
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "proctor_student@exam.io",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create an exam as examiner
    await client.post("/api/v1/auth/register", json={
        "email": "proctor_examiner@exam.io",
        "password": "password123",
        "full_name": "Proctor Prof",
        "role": "examiner"
    })
    ex_login = await client.post("/api/v1/auth/login", json={
        "email": "proctor_examiner@exam.io",
        "password": "password123"
    })
    ex_headers = {"Authorization": f"Bearer {ex_login.json()['access_token']}"}

    exam_resp = await client.post("/api/v1/exams/", json={
        "title": "Proctored AI Assessment",
        "subject": "CS",
        "instructions": "Strict proctoring enforced.",
        "duration_minutes": 30,
        "is_published": True
    }, headers=ex_headers)
    exam_id = exam_resp.json()["id"]

    # Student starts session
    sess_resp = await client.post("/api/v1/sessions/start", json={"exam_id": exam_id}, headers=headers)
    assert sess_resp.status_code == 200
    session_id = sess_resp.json()["session_id"]

    # 1. Send telemetry: Face absent violation
    telem_absent = await client.post("/api/v1/proctoring/telemetry", json={
        "session_id": session_id,
        "violation_type": "FACE_ABSENT",
        "confidence": 0.95,
        "details": {"duration_seconds": 6}
    })
    assert telem_absent.status_code == 200
    data_absent = telem_absent.json()
    assert data_absent["current_suspicion_score"] > 0
    assert data_absent["violations_count"] >= 1

    # 2. Send telemetry: Multiple faces detected
    telem_multi = await client.post("/api/v1/proctoring/telemetry", json={
        "session_id": session_id,
        "violation_type": "MULTI_FACE",
        "confidence": 0.98,
        "details": {"face_count": 2}
    })
    assert telem_multi.status_code == 200
    data_multi = telem_multi.json()
    assert data_multi["current_suspicion_score"] > data_absent["current_suspicion_score"]

    # 3. Check Live Overview
    overview_resp = await client.get("/api/v1/proctoring/live-overview")
    assert overview_resp.status_code == 200
    overview_data = overview_resp.json()
    assert overview_data["total_active_sessions"] >= 1
    assert len(overview_data["recent_alerts"]) >= 2
    assert any(a["session_id"] == session_id for a in overview_data["recent_alerts"])


@pytest.mark.asyncio
async def test_exam_schedule_crud_and_sync(client: AsyncClient):
    # Register Examiner
    reg_ex = await client.post("/api/v1/auth/register", json={
        "email": "schedule_prof@exam.io",
        "password": "password123",
        "full_name": "Schedule Prof",
        "role": "examiner"
    })
    assert reg_ex.status_code == 201
    
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "schedule_prof@exam.io",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create exam with start and end schedule window
    create_resp = await client.post("/api/v1/exams/", json={
        "title": "Initial Scheduled Exam",
        "subject": "CS301",
        "instructions": "Initial instructions",
        "duration_minutes": 60,
        "start_window": "2026-09-15T10:00:00Z",
        "end_window": "2026-09-15T12:00:00Z",
        "is_published": True
    }, headers=headers)
    assert create_resp.status_code == 201
    exam = create_resp.json()
    exam_id = exam["id"]
    assert exam["title"] == "Initial Scheduled Exam"
    assert exam["duration_minutes"] == 60
    assert "2026-09-15T10:00:00" in exam["start_window"]

    # 2. Reschedule Exam (PUT /api/v1/exams/{exam_id})
    update_resp = await client.put(f"/api/v1/exams/{exam_id}", json={
        "title": "Rescheduled Final Exam",
        "duration_minutes": 90,
        "start_window": "2026-09-18T14:00:00Z",
        "end_window": "2026-09-18T16:00:00Z"
    }, headers=headers)
    assert update_resp.status_code == 200
    updated_exam = update_resp.json()
    assert updated_exam["title"] == "Rescheduled Final Exam"
    assert updated_exam["duration_minutes"] == 90
    assert "2026-09-18T14:00:00" in updated_exam["start_window"]
    assert "2026-09-18T16:00:00" in updated_exam["end_window"]

    # 3. Verify single source of truth in GET list
    list_resp = await client.get("/api/v1/exams/", headers=headers)
    assert list_resp.status_code == 200
    all_exams = list_resp.json()
    found = [e for e in all_exams if e["id"] == exam_id]
    assert len(found) == 1
    assert found[0]["title"] == "Rescheduled Final Exam"
    assert found[0]["duration_minutes"] == 90

    # 4. Delete/Cancel scheduled exam (DELETE /api/v1/exams/{exam_id})
    del_resp = await client.delete(f"/api/v1/exams/{exam_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["id"] == exam_id

    # 5. Verify exam is removed
    get_del = await client.get(f"/api/v1/exams/{exam_id}", headers=headers)
    assert get_del.status_code == 404


@pytest.mark.asyncio
async def test_materials_search_and_crud(client: AsyncClient):
    # 1. Register & Login Examiner
    reg_ex = await client.post("/api/v1/auth/register", json={
        "email": "material_prof@exam.io",
        "password": "password123",
        "full_name": "Material Prof",
        "role": "examiner"
    })
    assert reg_ex.status_code == 201
    
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "material_prof@exam.io",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get default seeded materials
    res_all = await client.get("/api/v1/materials/", headers=headers)
    assert res_all.status_code == 200
    all_items = res_all.json()
    assert len(all_items) >= 5

    # 3. Search case-insensitive & trimmed
    res_search1 = await client.get("/api/v1/materials/?q=  data structures  ", headers=headers)
    assert res_search1.status_code == 200
    assert any("Data Structures in C++" in m["title"] for m in res_search1.json())

    res_search2 = await client.get("/api/v1/materials/?q=OPERATING SYSTEMS", headers=headers)
    assert res_search2.status_code == 200
    assert any("Operating Systems Architecture" in m["title"] for m in res_search2.json())

    # 4. Partial search across description
    res_partial = await client.get("/api/v1/materials/?q=concurrency", headers=headers)
    assert res_partial.status_code == 200
    assert len(res_partial.json()) >= 1

    # 5. No results
    res_none = await client.get("/api/v1/materials/?q=xyznonexistentquery999", headers=headers)
    assert res_none.status_code == 200
    assert len(res_none.json()) == 0

    # 6. Search + subject filter
    res_filt = await client.get("/api/v1/materials/?q=trees&subject=Computer Science", headers=headers)
    assert res_filt.status_code == 200
    assert len(res_filt.json()) >= 1

    # 7. Create new material
    create_mat = await client.post("/api/v1/materials/", json={
        "title": "Quantum Computing Fundamentals",
        "subject": "Physics & Computing",
        "category": "Handbook",
        "description": "Qubits, superposition, entanglement, and Grover search algorithm.",
        "file_format": "PDF",
        "pages": 50
    }, headers=headers)
    assert create_mat.status_code == 201
    mat_id = create_mat.json()["id"]

    # Verify search finds newly created material
    res_new = await client.get("/api/v1/materials/?q=quantum", headers=headers)
    assert res_new.status_code == 200
    assert any(m["id"] == mat_id for m in res_new.json())

    # 8. Delete material
    del_res = await client.delete(f"/api/v1/materials/{mat_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify deleted material no longer appears
    res_after_del = await client.get("/api/v1/materials/?q=quantum", headers=headers)
    assert res_after_del.status_code == 200
    assert not any(m["id"] == mat_id for m in res_after_del.json())


@pytest.mark.asyncio
async def test_forum_search_pagination_and_replies(client: AsyncClient):
    # 1. Register Student
    reg_st = await client.post("/api/v1/auth/register", json={
        "email": "forum_student@exam.io",
        "password": "password123",
        "full_name": "Forum Student",
        "role": "student"
    })
    assert reg_st.status_code == 201
    
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "forum_student@exam.io",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get initial paginated posts
    res_all = await client.get("/api/v1/forum/?page=1&page_size=3", headers=headers)
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert len(data_all["items"]) == 3
    assert data_all["total"] >= 5
    assert data_all["total_pages"] >= 2

    # 3. Exact and case-insensitive search
    res_search1 = await client.get("/api/v1/forum/?q=B-TREE", headers=headers)
    assert res_search1.status_code == 200
    assert any("B-Tree" in item["title"] for item in res_search1.json()["items"])

    # 4. Partial search across content
    res_search2 = await client.get("/api/v1/forum/?q=pigeonhole", headers=headers)
    assert res_search2.status_code == 200
    assert len(res_search2.json()["items"]) >= 1

    # 5. Search with no results
    res_empty = await client.get("/api/v1/forum/?q=nonexistentforumsearchkeyword777", headers=headers)
    assert res_empty.status_code == 200
    assert len(res_empty.json()["items"]) == 0
    assert res_empty.json()["total"] == 0

    # 6. Search + subject & tag filter
    res_filt = await client.get("/api/v1/forum/?q=Dijkstra&subject=Computer Science&tag=Exam Prep", headers=headers)
    assert res_filt.status_code == 200
    assert len(res_filt.json()["items"]) >= 1

    # 7. Create new discussion post
    res_create = await client.post("/api/v1/forum/", json={
        "title": "Discussion on Byzantine Fault Tolerance",
        "content": "How does PBFT achieve safety under partial synchrony with 3f + 1 nodes?",
        "subject": "Distributed Systems",
        "tag": "Discussion"
    }, headers=headers)
    assert res_create.status_code == 201
    new_post = res_create.json()
    post_id = new_post["id"]

    # Verify search finds the newly created post
    res_find_new = await client.get("/api/v1/forum/?q=Byzantine", headers=headers)
    assert res_find_new.status_code == 200
    assert any(p["id"] == post_id for p in res_find_new.json()["items"])

    # 8. Add a reply to the new post
    res_reply = await client.post(f"/api/v1/forum/{post_id}/replies", json={
        "content": "PBFT uses 3-phase commit: pre-prepare, prepare, and commit to reach consensus."
    }, headers=headers)
    assert res_reply.status_code == 201
    assert res_reply.json()["post_id"] == post_id

    # Verify post replies_count incremented
    res_post_detail = await client.get(f"/api/v1/forum/{post_id}", headers=headers)
    assert res_post_detail.status_code == 200
    detail = res_post_detail.json()
    assert detail["replies_count"] == 1
    assert len(detail["replies"]) == 1

    # 9. Delete post
    del_res = await client.delete(f"/api/v1/forum/{post_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify deleted post no longer appears
    res_after_del = await client.get("/api/v1/forum/?q=Byzantine", headers=headers)
    assert res_after_del.status_code == 200
    assert not any(p["id"] == post_id for p in res_after_del.json()["items"])


@pytest.mark.asyncio
async def test_question_bank_mcq_search_and_filters(client: AsyncClient):
    # 1. Login as examiner
    await client.post("/api/v1/auth/register", json={
        "email": "mcq_examiner@examora.io",
        "password": "password123",
        "full_name": "Examiner MCQ Tester",
        "role": "examiner"
    })
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "mcq_examiner@examora.io",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create sample questions (MCQ and subjective)
    q1_resp = await client.post("/api/v1/questions/", json={
        "subject": "Computer Science",
        "topic": "Operating Systems",
        "question_type": "MCQ",
        "difficulty": "medium",
        "content": "Which CPU scheduling algorithm minimizes average wait time for known burst durations?",
        "model_answer": "Shortest Job First (SJF)",
        "max_marks": 2.0,
        "negative_marks": 0.5,
        "options": [
            {"option_text": "Shortest Job First (SJF)", "is_correct": True, "sort_order": 0},
            {"option_text": "First Come First Served (FCFS)", "is_correct": False, "sort_order": 1},
            {"option_text": "Round Robin (RR)", "is_correct": False, "sort_order": 2}
        ]
    }, headers=headers)
    assert q1_resp.status_code == 201

    q2_resp = await client.post("/api/v1/questions/", json={
        "subject": "Data Structures",
        "topic": "Trees & Heaps",
        "question_type": "MCQ",
        "difficulty": "hard",
        "content": "What is the worst-case time complexity of searching an element in a balanced AVL tree?",
        "model_answer": "O(log N)",
        "max_marks": 3.0,
        "negative_marks": 0.5,
        "options": [
            {"option_text": "O(log N)", "is_correct": True, "sort_order": 0},
            {"option_text": "O(N)", "is_correct": False, "sort_order": 1},
            {"option_text": "O(1)", "is_correct": False, "sort_order": 2}
        ]
    }, headers=headers)
    assert q2_resp.status_code == 201

    # 3. Test search by keyword in content (case-insensitive)
    search_resp = await client.get("/api/v1/questions/?q=scheduling", headers=headers)
    assert search_resp.status_code == 200
    questions = search_resp.json()
    assert len(questions) >= 1
    assert any("scheduling" in q["content"].lower() for q in questions)

    # 4. Test uppercase / lowercase search
    upper_resp = await client.get("/api/v1/questions/?q=AVL", headers=headers)
    assert upper_resp.status_code == 200
    assert any("avl" in q["content"].lower() for q in upper_resp.json())

    # 5. Test search by topic
    topic_resp = await client.get("/api/v1/questions/?q=Operating Systems", headers=headers)
    assert topic_resp.status_code == 200
    assert any("Operating Systems" in (q["topic"] or "") for q in topic_resp.json())

    # 6. Test subject filter
    subj_resp = await client.get("/api/v1/questions/?subject=Data Structures", headers=headers)
    assert subj_resp.status_code == 200
    for q in subj_resp.json():
        assert "data structures" in q["subject"].lower()

    # 7. Test question_type filter
    mcq_resp = await client.get("/api/v1/questions/?question_type=MCQ", headers=headers)
    assert mcq_resp.status_code == 200
    for q in mcq_resp.json():
        assert q["question_type"] == "MCQ"

    # 8. Test combined search + subject filter
    combined_resp = await client.get("/api/v1/questions/?q=worst-case&subject=Data Structures", headers=headers)
    assert combined_resp.status_code == 200
    assert len(combined_resp.json()) >= 1

    # 9. Test no results for non-existent keyword
    empty_resp = await client.get("/api/v1/questions/?q=nonexistentxyzkeyword99", headers=headers)
    assert empty_resp.status_code == 200
    assert len(empty_resp.json()) == 0


@pytest.mark.asyncio
async def test_notifications_lifecycle_and_read_state(client: AsyncClient):
    # 1. Register and login student
    await client.post("/api/v1/auth/register", json={
        "email": "notif_student@examora.io",
        "password": "password123",
        "full_name": "Notif Candidate",
        "role": "student"
    })
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "notif_student@examora.io",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. List notifications (should auto-seed context notifications for student)
    list_resp = await client.get("/api/v1/notifications/", headers=headers)
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert "items" in data
    assert "unread_count" in data
    assert len(data["items"]) > 0
    assert data["unread_count"] > 0

    first_notif = data["items"][0]
    notif_id = first_notif["id"]
    assert first_notif["is_read"] is False
    initial_unread = data["unread_count"]

    # 3. Mark single notification as read
    read_resp = await client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers)
    assert read_resp.status_code == 200
    assert read_resp.json()["is_read"] is True

    # 4. Verify unread count decremented
    list_after_one = await client.get("/api/v1/notifications/", headers=headers)
    assert list_after_one.json()["unread_count"] == initial_unread - 1

    # 5. Mark all as read
    mark_all_resp = await client.post("/api/v1/notifications/mark-all-read", headers=headers)
    assert mark_all_resp.status_code == 200

    # 6. Verify 0 unread remain
    final_list = await client.get("/api/v1/notifications/", headers=headers)
    assert final_list.json()["unread_count"] == 0
    for item in final_list.json()["items"]:
        assert item["is_read"] is True





