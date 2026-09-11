import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class UserRole(str):
    STUDENT = "student"
    EXAMINER = "examiner"
    ADMIN = "admin"

class QuestionType(str):
    MCQ = "MCQ"
    MULTI_SELECT = "multi_select"
    SHORT_ANSWER = "short_answer"
    LONG_ANSWER = "long_answer"
    IMAGE_UPLOAD = "image_upload"

class DifficultyLevel(str):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class SessionStatus(str):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    TIMED_OUT = "TIMED_OUT"
    FLAGGED = "FLAGGED"
    DISQUALIFIED = "DISQUALIFIED"

class IntegrityStatus(str):
    CLEARED = "CLEARED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    VOIDED = "VOIDED"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.STUDENT, nullable=False)  # student, examiner, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    created_questions = relationship("QuestionBank", back_populates="creator")
    created_exams = relationship("Exam", back_populates="creator")
    sessions = relationship("ExamSession", back_populates="student")
    evaluations = relationship("SubjectiveEvaluation", back_populates="examiner")

class QuestionBank(Base):
    __tablename__ = "question_bank"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject = Column(String(100), index=True, nullable=False)
    topic = Column(String(100), index=True, nullable=True)
    question_type = Column(String(50), nullable=False)  # MCQ, multi_select, short_answer, long_answer, image_upload
    difficulty = Column(String(50), default=DifficultyLevel.MEDIUM, nullable=False)
    content = Column(Text, nullable=False)
    model_answer = Column(Text, nullable=True)
    rubric_criteria = Column(JSON, nullable=True)  # List of criteria with points
    max_marks = Column(Float, default=1.0, nullable=False)
    negative_marks = Column(Float, default=0.0, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    creator = relationship("User", back_populates="created_questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan", lazy="selectin")
    exam_associations = relationship("ExamQuestion", back_populates="question")
    answers = relationship("StudentAnswer", back_populates="question")

class QuestionOption(Base):
    __tablename__ = "question_options"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("question_bank.id"), nullable=False)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0)
    
    question = relationship("QuestionBank", back_populates="options")

class Exam(Base):
    __tablename__ = "exams"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    subject = Column(String(100), index=True, nullable=False)
    instructions = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=60, nullable=False)
    start_window = Column(DateTime(timezone=True), nullable=True)
    end_window = Column(DateTime(timezone=True), nullable=True)
    blueprint_rules = Column(JSON, nullable=True)  # { "easy_count": 5, "medium_count": 5, "hard_count": 2 }
    proctoring_config = Column(JSON, nullable=True)  # { "webcam_required": True, "gaze_tracking": True, "max_tab_switches": 3 }
    is_published = Column(Boolean, default=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    creator = relationship("User", back_populates="created_exams")
    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan", order_by="ExamQuestion.order_index")
    sessions = relationship("ExamSession", back_populates="exam")

class ExamQuestion(Base):
    __tablename__ = "exam_questions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=False)
    question_id = Column(String(36), ForeignKey("question_bank.id"), nullable=False)
    order_index = Column(Integer, default=0)
    
    exam = relationship("Exam", back_populates="questions")
    question = relationship("QuestionBank", back_populates="exam_associations", lazy="selectin")

class ExamSession(Base):
    __tablename__ = "exam_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    session_token = Column(Text, unique=True, index=True, nullable=False)
    status = Column(String(50), default=SessionStatus.NOT_STARTED, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    server_deadline = Column(DateTime(timezone=True), nullable=True)
    total_tab_switches = Column(Integer, default=0)
    final_suspicion_score = Column(Float, default=0.0)
    
    exam = relationship("Exam", back_populates="sessions", lazy="selectin")
    student = relationship("User", back_populates="sessions", lazy="selectin")
    answers = relationship("StudentAnswer", back_populates="session", cascade="all, delete-orphan")
    proctor_events = relationship("ProctorEvent", back_populates="session", cascade="all, delete-orphan")
    result = relationship("ExamResult", back_populates="session", uselist=False)

class StudentAnswer(Base):
    __tablename__ = "student_answers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("exam_sessions.id"), nullable=False)
    question_id = Column(String(36), ForeignKey("question_bank.id"), nullable=False)
    selected_option_ids = Column(JSON, nullable=True)  # List of option UUIDs for MCQ / multi_select
    text_response = Column(Text, nullable=True)
    image_path = Column(String(255), nullable=True)
    ocr_extracted_text = Column(Text, nullable=True)
    word_count = Column(Integer, default=0)
    answered_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    session = relationship("ExamSession", back_populates="answers")
    question = relationship("QuestionBank", back_populates="answers", lazy="selectin")
    evaluation = relationship("SubjectiveEvaluation", back_populates="answer", uselist=False)

class ProctorEvent(Base):
    __tablename__ = "proctor_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("exam_sessions.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=get_utc_now)
    event_type = Column(String(100), nullable=False)  # FACE_ABSENT, MULTI_FACE, GAZE_AWAY, TAB_BLUR, DEVTOOLS_OPEN
    suspicion_delta = Column(Float, default=0.0)
    snapshot_path = Column(String(255), nullable=True)
    raw_telemetry = Column(JSON, nullable=True)
    
    session = relationship("ExamSession", back_populates="proctor_events")

class ExamResult(Base):
    __tablename__ = "exam_results"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("exam_sessions.id"), unique=True, nullable=False)
    objective_score = Column(Float, default=0.0)
    subjective_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    max_possible_score = Column(Float, default=0.0)
    percentile = Column(Float, default=0.0)
    integrity_status = Column(String(50), default=IntegrityStatus.CLEARED)
    is_published = Column(Boolean, default=False)
    evaluated_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    session = relationship("ExamSession", back_populates="result", lazy="selectin")

class SubjectiveEvaluation(Base):
    __tablename__ = "subjective_evaluations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    answer_id = Column(String(36), ForeignKey("student_answers.id"), unique=True, nullable=False)
    ai_suggested_score = Column(Float, default=0.0)
    ai_justification = Column(Text, nullable=True)
    ai_rubric_breakdown = Column(JSON, nullable=True)
    final_examiner_score = Column(Float, nullable=True)
    examiner_feedback = Column(Text, nullable=True)
    image_annotations = Column(JSON, nullable=True)  # List of coordinates and comments on handwritten image
    evaluated_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    evaluated_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    answer = relationship("StudentAnswer", back_populates="evaluation", lazy="selectin")
    examiner = relationship("User", back_populates="evaluations")
