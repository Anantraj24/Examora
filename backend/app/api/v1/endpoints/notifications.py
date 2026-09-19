from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, update
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user, require_role
from app.models.models import User, UserRole, Notification
from app.schemas.schemas import NotificationCreate, NotificationOut, NotificationListOut

router = APIRouter()

SEED_NOTIFICATIONS = [
    {
        "title": "Proctored Exam Scheduled",
        "message": "Advanced Computer Systems & AI Final is open for candidate verification.",
        "category": "exam",
        "target_route": "assessments",
        "target_role": "student"
    },
    {
        "title": "Master Schedule Updated",
        "message": "Distributed Systems Final timeline has been synchronized across calendar slots.",
        "category": "schedule",
        "target_route": "schedule",
        "target_role": None
    },
    {
        "title": "New Course Material Available",
        "message": "Distributed Systems Handout (CAP & Raft Consensus) has been published in Materials.",
        "category": "material",
        "target_route": "materials",
        "target_role": "student"
    },
    {
        "title": "New Answer in Discussion Forum",
        "message": "Prof. Sarah Connor replied to your query regarding B-Tree insertion splits.",
        "category": "forum",
        "target_route": "forum",
        "target_role": None
    },
    {
        "title": "Evaluations Queue Update",
        "message": "New student submissions are pending AI-assisted rubric verification in Examiner Studio.",
        "category": "grading",
        "target_route": "grading",
        "target_role": "examiner"
    },
    {
        "title": "Question Bank Updated",
        "message": "New structured MCQ and subjective questions added to the Computer Science repository.",
        "category": "questions",
        "target_route": "questions",
        "target_role": "examiner"
    }
]

@router.get("/", response_model=NotificationListOut)
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Query notifications for user or user's role / system broadcast
    stmt = select(Notification).where(
        or_(
            Notification.user_id == current_user.id,
            and_(
                Notification.user_id == None,
                or_(
                    Notification.target_role == None,
                    Notification.target_role == current_user.role
                )
            )
        )
    ).order_by(Notification.created_at.desc())
    
    result = await db.execute(stmt)
    notifications = list(result.scalars().all())
    
    # Auto-seed initial contextual notifications if database has none
    if not notifications:
        for seed in SEED_NOTIFICATIONS:
            if seed["target_role"] is None or seed["target_role"] == current_user.role:
                n = Notification(
                    user_id=current_user.id,
                    target_role=seed["target_role"],
                    title=seed["title"],
                    message=seed["message"],
                    category=seed["category"],
                    target_route=seed["target_route"],
                    is_read=False
                )
                db.add(n)
        await db.commit()
        result = await db.execute(stmt)
        notifications = list(result.scalars().all())
        
    unread = sum(1 for n in notifications if not n.is_read)
    return NotificationListOut(items=notifications, unread_count=unread)

@router.post("/", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notif_in: NotificationCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.EXAMINER])),
    db: AsyncSession = Depends(get_db)
):
    notif = Notification(
        user_id=notif_in.user_id,
        target_role=notif_in.target_role,
        title=notif_in.title,
        message=notif_in.message,
        category=notif_in.category,
        target_route=notif_in.target_route,
        is_read=False
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif

@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Notification).where(Notification.id == notification_id)
    result = await db.execute(stmt)
    notif = result.scalar_one_or_none()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif

@router.post("/mark-all-read", response_model=dict)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        update(Notification)
        .where(
            or_(
                Notification.user_id == current_user.id,
                Notification.user_id == None
            ),
            Notification.is_read == False
        )
        .values(is_read=True)
    )
    res = await db.execute(stmt)
    await db.commit()
    return {"message": "All notifications marked as read", "updated": res.rowcount}
