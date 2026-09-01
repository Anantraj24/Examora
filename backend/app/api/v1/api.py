from fastapi import APIRouter
from app.api.v1.endpoints import auth, questions, exams, exam_sessions, answers, proctoring_ws, evaluations, results

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(questions.router, prefix="/questions", tags=["Question Bank"])
api_router.include_router(exams.router, prefix="/exams", tags=["Exams Configuration"])
api_router.include_router(exam_sessions.router, prefix="/sessions", tags=["Exam Sessions"])
api_router.include_router(answers.router, prefix="/answers", tags=["Answer Submissions"])
api_router.include_router(proctoring_ws.router, prefix="/proctoring", tags=["AI Proctoring & WebSockets"])
api_router.include_router(evaluations.router, prefix="/evaluations", tags=["Examiner Grading Studio"])
api_router.include_router(results.router, prefix="/results", tags=["Results & Candidate Analytics"])
