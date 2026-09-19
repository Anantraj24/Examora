from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user, require_role
from app.models.models import User, UserRole, AcademicEvent, Exam
from app.schemas.schemas import AcademicEventCreate, AcademicEventOut

router = APIRouter()

@router.get("/upcoming", response_model=List[AcademicEventOut])
async def list_upcoming_events(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    # Include active events today (within last 2 hours to avoid cutoff of currently ongoing events)
    threshold = now - timedelta(hours=2)

    stmt = select(AcademicEvent).where(
        AcademicEvent.start_time >= threshold,
        or_(
            AcademicEvent.target_role == None,
            AcademicEvent.target_role == current_user.role
        )
    ).order_by(AcademicEvent.start_time.asc()).limit(limit)

    result = await db.execute(stmt)
    events = list(result.scalars().all())

    # Auto-seed realistic upcoming events anchored to current real time if empty
    if not events:
        seed_items = [
            AcademicEvent(
                title="Advanced Computer Systems & AI Final",
                description="Live proctored final assessment. AI webcam telemetry and gaze tracking active.",
                event_type="exam",
                subject="Computer Science",
                start_time=now + timedelta(hours=2),
                end_time=now + timedelta(hours=3),
                location_or_link="Examora Secure Proctor HUD",
                target_role=None
            ),
            AcademicEvent(
                title="Distributed Systems & CAP Theorem Review",
                description="Live faculty interactive review session on Quorum consensus and partition tolerance.",
                event_type="review",
                subject="Computer Science",
                start_time=now + timedelta(days=1, hours=3),
                end_time=now + timedelta(days=1, hours=4, minutes=30),
                location_or_link="Auditorium Virtual Room 4",
                target_role=None
            ),
            AcademicEvent(
                title="Neural Architectures & Transformers Webinar",
                description="Guest speaker industry session on modern LLM attention mechanisms and quantization.",
                event_type="webinar",
                subject="AI & ML",
                start_time=now + timedelta(days=3, hours=5),
                end_time=now + timedelta(days=3, hours=6, minutes=30),
                location_or_link="Zoom Live Stream",
                target_role=None
            ),
            AcademicEvent(
                title="Operating Systems Project Milestone Submission",
                description="Kernel paging and memory management project milestone upload deadline.",
                event_type="deadline",
                subject="Computer Science",
                start_time=now + timedelta(days=5, hours=8),
                end_time=now + timedelta(days=5, hours=9),
                location_or_link="Examora Submissions Portal",
                target_role=None
            )
        ]
        for item in seed_items:
            db.add(item)
        await db.commit()
        
        result = await db.execute(stmt)
        events = list(result.scalars().all())

    return events

@router.post("/", response_model=AcademicEventOut, status_code=status.HTTP_201_CREATED)
async def create_academic_event(
    event_in: AcademicEventCreate,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    event = AcademicEvent(
        title=event_in.title,
        description=event_in.description,
        event_type=event_in.event_type,
        subject=event_in.subject,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        location_or_link=event_in.location_or_link,
        exam_id=event_in.exam_id,
        target_role=event_in.target_role
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_academic_event(
    event_id: str,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AcademicEvent).where(AcademicEvent.id == event_id)
    res = await db.execute(stmt)
    event = res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
    return None
