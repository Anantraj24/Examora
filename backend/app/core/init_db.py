import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.models import (
    User, UserRole, QuestionBank, QuestionOption, Exam, ExamQuestion,
    QuestionType, DifficultyLevel
)
from app.core.seed_data import seed_full_enterprise_dataset

async def init_db():
    try:
        # 1. Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        # 2. Seed initial enterprise data
        await seed_full_enterprise_dataset()
        print("[INFO] Database initialization and enterprise seed completed successfully.")
    except Exception as e:
        print(f"[WARNING] Database initialization deferred or non-fatal warning: {e}")
