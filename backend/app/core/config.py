import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Examora - AI Intelligent Examination Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "secret-key-for-examora-platform-production-sec-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for general access
    SESSION_TOKEN_EXPIRE_MINUTES: int = 180     # 3 hours for exam sessions
    
    # Database (Defaults to asynchronous SQLite for seamless local execution and PostgreSQL support)
    DATABASE_URL: str = "sqlite+aiosqlite:///./exam_platform.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # Upload directories
    UPLOAD_DIR: str = "./uploads/answers"
    SNAPSHOT_DIR: str = "./uploads/snapshots"
    
    # AI & LLM Service
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # Proctoring thresholds
    PROCTORING_HEARTBEAT_INTERVAL_SEC: int = 10
    MAX_TAB_SWITCH_WARNINGS: int = 3
    GAZE_OUT_OF_BOUNDS_THRESHOLD: float = 0.35
    FACE_ABSENCE_PENALTY_RATE: float = 12.0
    MULTI_FACE_PENALTY: float = 25.0
    TAB_SWITCH_PENALTY: float = 15.0
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()

# Ensure upload directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.SNAPSHOT_DIR, exist_ok=True)
