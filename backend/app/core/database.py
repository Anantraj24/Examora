from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

import urllib.parse

def get_async_database_url(raw_url: str) -> str:
    url = raw_url.strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Auto-heal unencoded '@' symbols inside password
    if "://" in url:
        prefix, _, rest = url.partition("://")
        if "@" in rest:
            path_start = len(rest)
            for sep in ["/", "?"]:
                idx = rest.find(sep)
                if idx != -1 and idx < path_start:
                    path_start = idx
            auth_part = rest[:path_start]
            after_part = rest[path_start:]
            last_at = auth_part.rfind("@")
            user_pass = auth_part[:last_at]
            host_port = auth_part[last_at + 1:]
            if ":" in user_pass:
                username, _, password = user_pass.partition(":")
                encoded_password = urllib.parse.quote(urllib.parse.unquote(password))
                url = f"{prefix}://{username}:{encoded_password}@{host_port}{after_part}"
    return url

db_url = get_async_database_url(settings.DATABASE_URL)

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
