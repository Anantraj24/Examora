from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "student"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None

# ----------------- Question & Option Schemas -----------------
class OptionBase(BaseModel):
    option_text: str
    is_correct: bool = False
    sort_order: int = 0

class OptionCreate(OptionBase):
    pass

class OptionOut(OptionBase):
    id: str
    question_id: str
    
    model_config = ConfigDict(from_attributes=True)

class OptionStudentOut(BaseModel):
    id: str
    option_text: str
    sort_order: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class QuestionBase(BaseModel):
    subject: str
    topic: Optional[str] = None
    question_type: str  # MCQ, multi_select, short_answer, long_answer, image_upload
    difficulty: str = "medium"
    content: str
    model_answer: Optional[str] = None
    rubric_criteria: Optional[List[Dict[str, Any]]] = None
    max_marks: float = 1.0
    negative_marks: float = 0.0

class QuestionCreate(QuestionBase):
    options: Optional[List[OptionCreate]] = None

    @field_validator("options")
    def validate_options(cls, v):
        return v

class QuestionUpdate(BaseModel):
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    content: Optional[str] = None
    model_answer: Optional[str] = None
    rubric_criteria: Optional[List[Dict[str, Any]]] = None
    max_marks: Optional[float] = None
    negative_marks: Optional[float] = None

class QuestionOut(QuestionBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime
    options: List[OptionOut] = []
    
    model_config = ConfigDict(from_attributes=True)

class QuestionStudentOut(BaseModel):
    id: str
    subject: str
    topic: Optional[str] = None
    question_type: str
    difficulty: str
    content: str
    max_marks: float
    negative_marks: float
    options: List[OptionStudentOut] = []
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- Exam Schemas -----------------
class ExamBase(BaseModel):
    title: str
    subject: str
    instructions: Optional[str] = None
    duration_minutes: int = 60
    start_window: Optional[datetime] = None
    end_window: Optional[datetime] = None
    blueprint_rules: Optional[Dict[str, Any]] = None
    proctoring_config: Optional[Dict[str, Any]] = None
    is_published: bool = False

class ExamCreate(ExamBase):
    question_ids: Optional[List[str]] = None

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    instructions: Optional[str] = None
    duration_minutes: Optional[int] = None
    start_window: Optional[datetime] = None
    end_window: Optional[datetime] = None
    blueprint_rules: Optional[Dict[str, Any]] = None
    proctoring_config: Optional[Dict[str, Any]] = None
    is_published: Optional[bool] = None
    question_ids: Optional[List[str]] = None

class ExamOut(ExamBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime
    total_questions: int = 0
    total_marks: float = 0.0
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- Exam Session & Paper Schemas -----------------
class SessionStartRequest(BaseModel):
    exam_id: str

class PaperQuestionView(BaseModel):
    id: str
    order_index: int
    question_type: str
    difficulty: str
    content: str
    max_marks: float
    negative_marks: float
    options: List[OptionStudentOut] = []
    saved_answer: Optional[Dict[str, Any]] = None

class StudentExamPaperOut(BaseModel):
    session_id: str
    session_token: str
    exam_id: str
    exam_title: str
    duration_minutes: int
    server_deadline: datetime
    server_time_remaining_seconds: int
    proctoring_config: Dict[str, Any]
    questions: List[PaperQuestionView]

class AnswerSubmitRequest(BaseModel):
    session_id: str
    question_id: str
    selected_option_ids: Optional[List[str]] = None
    text_response: Optional[str] = None
    image_base64: Optional[str] = None

class AnswerOut(BaseModel):
    id: str
    session_id: str
    question_id: str
    selected_option_ids: Optional[List[str]] = None
    text_response: Optional[str] = None
    image_path: Optional[str] = None
    ocr_extracted_text: Optional[str] = None
    word_count: int
    answered_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- Proctoring Schemas -----------------
class ProctorTelemetryPayload(BaseModel):
    session_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    face_detected: bool = True
    face_count: int = 1
    gaze_direction: str = "CENTER"  # CENTER, LEFT, RIGHT, UP, DOWN, OFF_SCREEN
    gaze_score: float = 0.0  # Deviation from center
    tab_hidden: bool = False
    window_blurred: bool = False
    snapshot_base64: Optional[str] = None

class ProctorHeartbeatResponse(BaseModel):
    status: str
    current_suspicion_score: float
    violations_count: int
    warning_message: Optional[str] = None

class ProctorEventOut(BaseModel):
    id: str
    session_id: str
    timestamp: datetime
    event_type: str
    suspicion_delta: float
    snapshot_path: Optional[str] = None
    raw_telemetry: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- Evaluation & Results Schemas -----------------
class SubjectiveGradingItem(BaseModel):
    answer_id: str
    student_id: str
    student_name: str
    question_id: str
    question_content: str
    question_type: str
    max_marks: float
    model_answer: Optional[str]
    rubric_criteria: Optional[List[Dict[str, Any]]]
    student_text: Optional[str]
    image_url: Optional[str]
    ocr_text: Optional[str]
    ai_suggested_score: Optional[float]
    ai_justification: Optional[str]
    ai_rubric_breakdown: Optional[Dict[str, Any]]
    final_examiner_score: Optional[float]
    examiner_feedback: Optional[str]
    image_annotations: Optional[List[Dict[str, Any]]]

class ExaminerGradeSubmit(BaseModel):
    answer_id: str
    final_score: float
    examiner_feedback: Optional[str] = None
    image_annotations: Optional[List[Dict[str, Any]]] = None

class ResultOut(BaseModel):
    id: str
    session_id: str
    student_name: str
    exam_title: str
    objective_score: float
    subjective_score: float
    total_score: float
    max_possible_score: float
    percentage: float
    percentile: float
    integrity_status: str
    is_published: bool
    evaluated_at: datetime
    question_breakdown: Optional[List[Dict[str, Any]]] = None
    
    model_config = ConfigDict(from_attributes=True)
