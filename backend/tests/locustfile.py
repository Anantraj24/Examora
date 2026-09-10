import random
import uuid
from locust import HttpUser, task, between

class ExamCandidateUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Register and log in candidate at the start of simulated exam session."""
        self.student_email = f"load_test_{uuid.uuid4().hex[:8]}@examora.io"
        self.password = "LoadPassword123!"
        
        # Register
        self.client.post("/api/v1/auth/register", json={
            "email": self.student_email,
            "password": self.password,
            "full_name": f"Stress Candidate {self.student_email[:12]}",
            "role": "student"
        })
        
        # Login
        resp = self.client.post("/api/v1/auth/login", json={
            "email": self.student_email,
            "password": self.password
        })
        
        if resp.status_code == 200:
            token = resp.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {token}"}
        else:
            self.headers = {}
            
        self.session_id = None
        self.question_ids = []

    @task(3)
    def fetch_published_exams(self):
        """Simulate candidate viewing the live exam list."""
        self.client.get("/api/v1/exams/?published_only=true", headers=self.headers)

    @task(1)
    def start_exam_flow(self):
        """Simulate starting an exam session and fetching randomized paper."""
        if not self.headers:
            return
        # Get active exams
        res = self.client.get("/api/v1/exams/?published_only=true", headers=self.headers)
        if res.status_code == 200 and res.json():
            exam = res.json()[0]
            start_res = self.client.post("/api/v1/sessions/start", json={"exam_id": exam["id"]}, headers=self.headers)
            if start_res.status_code == 200:
                data = start_res.json()
                self.session_id = data.get("session_id")
                self.question_ids = [q["id"] for q in data.get("questions", [])]

    @task(4)
    def save_candidate_answers(self):
        """Simulate candidate saving MCQ or text responses."""
        if not self.session_id or not self.question_ids:
            return
        qid = random.choice(self.question_ids)
        self.client.post("/api/v1/answers/save", json={
            "session_id": self.session_id,
            "question_id": qid,
            "text_response": "Simulated candidate subjective explanation covering fundamental architectural principles."
        }, headers=self.headers)

    @task(2)
    def simulate_telemetry_proctoring_pulse(self):
        """Simulate proctoring telemetry query / session status verification."""
        if not self.session_id:
            return
        # Verify session remaining time
        self.client.get(f"/api/v1/sessions/{self.session_id}/time-remaining", headers=self.headers)
