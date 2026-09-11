import socket
import pytest
import httpx

BASE_URL = "http://localhost:8000"

def is_server_online(host="127.0.0.1", port=8000) -> bool:
    try:
        with socket.create_connection((host, port), timeout=0.3):
            return True
    except OSError:
        return False

pytestmark = pytest.mark.skipif(
    not is_server_online(),
    reason="Live backend server is not running on http://localhost:8000"
)

@pytest.mark.asyncio
async def test_live_api_health():
    """Verify live system health endpoint."""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"

@pytest.mark.asyncio
async def test_live_examiner_login_and_fetch_exams():
    """Verify examiner login and exam listing flow."""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # Login as seeded examiner
        login_res = await client.post("/api/v1/auth/login", json={
            "email": "examiner@examora.io",
            "password": "examiner123"
        })
        assert login_res.status_code == 200, f"Examiner login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Fetch exams
        exams_res = await client.get("/api/v1/exams/?published_only=false", headers=headers)
        assert exams_res.status_code == 200, f"Fetch exams failed: {exams_res.text}"
        exams = exams_res.json()
        assert isinstance(exams, list)
        assert len(exams) > 0, "Expected seeded exams to be present"

@pytest.mark.asyncio
async def test_live_candidate_exam_flow():
    """Verify candidate authentication, session start, paper fetch, and final submission."""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # 1. Login as student
        student_res = await client.post("/api/v1/auth/login", json={
            "email": "priya@examora.io",
            "password": "student123"
        })
        assert student_res.status_code == 200
        student_token = student_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {student_token}"}

        # 2. Get available published exams
        exams_res = await client.get("/api/v1/exams/?published_only=true", headers=headers)
        assert exams_res.status_code == 200
        exams = exams_res.json()
        assert len(exams) > 0
        target_exam = exams[0]
        exam_id = target_exam["id"]

        # 3. Start or retrieve exam session
        start_res = await client.post(
            "/api/v1/sessions/start",
            json={"exam_id": exam_id},
            headers=headers
        )
        assert start_res.status_code in [200, 400]
        if start_res.status_code == 200:
            paper_data = start_res.json()
            session_id = paper_data["session_id"]
            assert "questions" in paper_data
            assert len(paper_data["questions"]) > 0

            # 4. Re-fetch randomized exam paper via session
            paper_res = await client.get(f"/api/v1/sessions/paper/{session_id}", headers=headers)
            assert paper_res.status_code == 200
            fetched_paper = paper_res.json()
            assert fetched_paper["session_id"] == session_id
            assert fetched_paper["server_time_remaining_seconds"] >= 0

            # 5. Final submission of the session
            submit_res = await client.post(f"/api/v1/sessions/submit-final/{session_id}", headers=headers)
            assert submit_res.status_code == 200
            submit_data = submit_res.json()
            assert submit_data["status"] == "success"
