import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.models import User, UserRole, ForumPost, ForumReply
from app.schemas.schemas import ForumPostCreate, ForumPostOut, ForumReplyCreate, ForumReplyOut, ForumPaginatedOut

router = APIRouter()

DEFAULT_POSTS = [
    {
        "title": "Question regarding B-Tree median split criteria in order 3",
        "content": "When splitting an overflowing 3-node in an order-3 B-Tree, is the median pushed upward before or after the child pointers are re-allocated? Any visual proof would be appreciated.",
        "subject": "Computer Science",
        "tag": "Question",
        "author_name": "Alex Mercer",
        "author_role": "student",
        "replies_count": 4,
        "upvotes": 12,
        "replies": [
            {
                "author_name": "Mary Johnson (mentor)",
                "author_role": "examiner",
                "content": "The median key is promoted into the parent node first, and the remaining left and right sub-keys become two distinct sibling leaves."
            },
            {
                "author_name": "Dr. Marcus Vance",
                "author_role": "examiner",
                "content": "Correct. Also note that if the root overflows, a new root node is created, which is how B-Tree height grows upward."
            }
        ]
    },
    {
        "title": "Quorum consensus read/write overlapping proof discussion",
        "content": "For a quorum system with N nodes, why is the condition R + W > N sufficient to guarantee that at least one node in the read set has the latest version of the write set?",
        "subject": "Distributed Systems",
        "tag": "Discussion",
        "author_name": "Mary Johnson (mentor)",
        "author_role": "examiner",
        "replies_count": 9,
        "upvotes": 25,
        "replies": [
            {
                "author_name": "Alex Mercer",
                "author_role": "student",
                "content": "By the Pigeonhole Principle! Since the sum of cardinalities |R| + |W| > N, the intersection of set R and set W must contain at least one node."
            }
        ]
    },
    {
        "title": "Preparation tips for upcoming Algorithms Final Proctored Exam",
        "content": "Please review Dijkstra vs Bellman-Ford complexity trade-offs, dynamic programming memoization matrices, and MediaPipe webcam positioning tips before starting.",
        "subject": "Computer Science",
        "tag": "Exam Prep",
        "author_name": "Prof. Sarah Connor",
        "author_role": "examiner",
        "replies_count": 14,
        "upvotes": 38,
        "replies": []
    },
    {
        "title": "Heuristics for A* graph search: admissibility vs consistency",
        "content": "Can someone provide an intuitive example of a heuristic that is admissible (never overestimates) but fails the monotonicity/consistency triangle inequality?",
        "subject": "Artificial Intelligence",
        "tag": "Discussion",
        "author_name": "Dr. Marcus Vance",
        "author_role": "examiner",
        "replies_count": 6,
        "upvotes": 17,
        "replies": []
    },
    {
        "title": "Common pitfalls in TCP sliding window congestion control",
        "content": "Why does fast retransmit trigger upon receiving 3 duplicate ACKs instead of waiting for the retransmission timeout timer to expire?",
        "subject": "Computer Science",
        "tag": "Question",
        "author_name": "Student Test",
        "author_role": "student",
        "replies_count": 2,
        "upvotes": 8,
        "replies": []
    }
]

async def ensure_seed_forum(db: AsyncSession):
    check = await db.execute(select(ForumPost).limit(1))
    if check.scalar_one_or_none() is None:
        for p in DEFAULT_POSTS:
            replies_data = p.pop("replies", [])
            post = ForumPost(**p)
            db.add(post)
            await db.flush()
            for r in replies_data:
                reply = ForumReply(post_id=post.id, **r)
                db.add(reply)
        await db.commit()

@router.get("/", response_model=ForumPaginatedOut)
async def list_forum_posts(
    q: Optional[str] = Query(None, description="Search term for title, content, or author"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    tag: Optional[str] = Query(None, description="Filter by tag (Question, Discussion, Exam Prep)"),
    sort_by: str = Query("recent", description="Sort by 'recent', 'popular', or 'unanswered'"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await ensure_seed_forum(db)

    # Base query
    base_query = select(ForumPost)

    # Search filter (case-insensitive, trimmed, across multiple fields)
    if q is not None:
        clean_q = q.strip()
        if clean_q:
            pattern = f"%{clean_q}%"
            base_query = base_query.where(
                or_(
                    ForumPost.title.ilike(pattern),
                    ForumPost.content.ilike(pattern),
                    ForumPost.author_name.ilike(pattern),
                    ForumPost.subject.ilike(pattern),
                    ForumPost.tag.ilike(pattern),
                    ForumPost.replies.any(ForumReply.content.ilike(pattern))
                )
            )

    # Subject filter
    if subject and subject.lower() != "all":
        base_query = base_query.where(ForumPost.subject.ilike(f"%{subject.strip()}%"))

    # Tag filter
    if tag and tag.lower() != "all":
        base_query = base_query.where(ForumPost.tag.ilike(f"%{tag.strip()}%"))

    # Total count for pagination
    count_query = select(func.count()).select_from(base_query.subquery())
    total_count = (await db.execute(count_query)).scalar_one()

    # Sorting
    if sort_by == "popular":
        base_query = base_query.order_by(ForumPost.upvotes.desc(), ForumPost.replies_count.desc())
    elif sort_by == "unanswered":
        base_query = base_query.order_by(ForumPost.replies_count.asc(), ForumPost.created_at.desc())
    else:  # "recent"
        base_query = base_query.order_by(ForumPost.created_at.desc())

    # Pagination offset & limit
    offset = (page - 1) * page_size
    query = base_query.options(selectinload(ForumPost.replies)).offset(offset).limit(page_size)
    result = await db.execute(query)
    posts = result.scalars().all()

    total_pages = max(1, math.ceil(total_count / page_size)) if total_count > 0 else 1

    return ForumPaginatedOut(
        items=posts,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("/", response_model=ForumPostOut, status_code=status.HTTP_201_CREATED)
async def create_forum_post(
    post_in: ForumPostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not post_in.title.strip() or not post_in.content.strip():
        raise HTTPException(status_code=400, detail="Title and content are required")

    post = ForumPost(
        title=post_in.title.strip(),
        content=post_in.content.strip(),
        subject=post_in.subject.strip(),
        tag=post_in.tag.strip(),
        author_name=current_user.full_name or current_user.email,
        author_id=current_user.id,
        author_role=current_user.role,
        replies_count=0,
        upvotes=1
    )
    db.add(post)
    await db.commit()
    
    # Reload with empty replies
    query = select(ForumPost).options(selectinload(ForumPost.replies)).where(ForumPost.id == post.id)
    refreshed = (await db.execute(query)).scalar_one()
    return refreshed

@router.get("/{post_id}", response_model=ForumPostOut)
async def get_forum_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(ForumPost).options(selectinload(ForumPost.replies)).where(ForumPost.id == post_id)
    result = await db.execute(query)
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Forum post not found")
    return post

@router.post("/{post_id}/replies", response_model=ForumReplyOut, status_code=status.HTTP_201_CREATED)
async def add_forum_reply(
    post_id: str,
    reply_in: ForumReplyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not reply_in.content.strip():
        raise HTTPException(status_code=400, detail="Reply content cannot be empty")

    query = select(ForumPost).where(ForumPost.id == post_id)
    post = (await db.execute(query)).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Forum post not found")

    reply = ForumReply(
        post_id=post_id,
        author_name=current_user.full_name or current_user.email,
        author_id=current_user.id,
        author_role=current_user.role,
        content=reply_in.content.strip()
    )
    db.add(reply)
    post.replies_count = (post.replies_count or 0) + 1
    await db.commit()
    await db.refresh(reply)
    return reply

@router.delete("/{post_id}", status_code=status.HTTP_200_OK)
async def delete_forum_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(ForumPost).where(ForumPost.id == post_id)
    post = (await db.execute(query)).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Forum post not found")

    # Only author or examiner/admin can delete
    if post.author_id != current_user.id and current_user.role not in [UserRole.EXAMINER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this discussion")

    await db.delete(post)
    await db.commit()
    return {"message": "Discussion deleted successfully", "id": post_id}
