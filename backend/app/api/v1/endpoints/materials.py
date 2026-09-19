from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user, require_role
from app.models.models import User, UserRole, CourseMaterial
from app.schemas.schemas import MaterialCreate, MaterialUpdate, MaterialOut

router = APIRouter()

DEFAULT_MATERIALS = [
    {
        "title": "Data Structures in C++",
        "subject": "Computer Science",
        "category": "Handbook",
        "description": "Comprehensive guide to balanced trees, heaps, amortized analysis, and graph algorithms.",
        "file_format": "PDF",
        "pages": 42,
        "download_url": "#"
    },
    {
        "title": "Operating Systems Architecture",
        "subject": "Computer Science",
        "category": "Handbook",
        "description": "Memory management, multi-threading, concurrency primitives, and file system internals.",
        "file_format": "PDF",
        "pages": 64,
        "download_url": "#"
    },
    {
        "title": "Discrete Mathematics & Logic",
        "subject": "Mathematics",
        "category": "Cheat Sheet",
        "description": "Set theory, predicate logic, proof techniques, combinatorics, and boolean algebra formulas.",
        "file_format": "PDF",
        "pages": 28,
        "download_url": "#"
    },
    {
        "title": "Relational Database Architecture & SQL Lab",
        "subject": "Information Systems",
        "category": "Reference",
        "description": "B-Trees, ACID transactions, normalization forms, query optimization, and execution plans.",
        "file_format": "PDF",
        "pages": 36,
        "download_url": "#"
    },
    {
        "title": "Neural Networks & Deep Learning Essentials",
        "subject": "Artificial Intelligence",
        "category": "Handbook",
        "description": "CNN backpropagation derivations, attention mechanisms, loss formulation, and gradient descent.",
        "file_format": "PDF",
        "pages": 55,
        "download_url": "#"
    },
    {
        "title": "Computer Networks & Socket Programming",
        "subject": "Computer Science",
        "category": "Cheat Sheet",
        "description": "TCP/IP handshake sequence, subnetting cheat-sheet, OSI model, and HTTP/3 QUIC protocol.",
        "file_format": "PDF",
        "pages": 19,
        "download_url": "#"
    }
]

async def ensure_seed_materials(db: AsyncSession):
    check = await db.execute(select(CourseMaterial).limit(1))
    if check.scalar_one_or_none() is None:
        for item in DEFAULT_MATERIALS:
            mat = CourseMaterial(**item)
            db.add(mat)
        await db.commit()

@router.get("/", response_model=List[MaterialOut])
async def list_materials(
    q: Optional[str] = Query(None, description="Search query string"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await ensure_seed_materials(db)
    
    query = select(CourseMaterial)
    
    # Process search query (case-insensitive, trimmed)
    if q is not None:
        clean_q = q.strip()
        if clean_q:
            pattern = f"%{clean_q}%"
            query = query.where(
                or_(
                    CourseMaterial.title.ilike(pattern),
                    CourseMaterial.description.ilike(pattern),
                    CourseMaterial.subject.ilike(pattern),
                    CourseMaterial.category.ilike(pattern)
                )
            )
            
    # Process subject filter
    if subject and subject.lower() != "all":
        query = query.where(CourseMaterial.subject.ilike(f"%{subject.strip()}%"))
        
    # Process category filter
    if category and category.lower() != "all":
        query = query.where(CourseMaterial.category.ilike(f"%{category.strip()}%"))
        
    query = query.order_by(CourseMaterial.created_at.desc())
    result = await db.execute(query)
    materials = result.scalars().all()
    return materials

@router.post("/", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
async def create_material(
    material_in: MaterialCreate,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    if not material_in.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
        
    mat = CourseMaterial(
        title=material_in.title.strip(),
        subject=material_in.subject.strip(),
        category=material_in.category.strip(),
        description=material_in.description.strip() if material_in.description else None,
        file_format=material_in.file_format,
        pages=material_in.pages,
        download_url=material_in.download_url or "#",
        created_by=current_user.id
    )
    db.add(mat)
    await db.commit()
    await db.refresh(mat)
    return mat

@router.delete("/{material_id}", status_code=status.HTTP_200_OK)
async def delete_material(
    material_id: str,
    current_user: User = Depends(require_role([UserRole.EXAMINER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CourseMaterial).where(CourseMaterial.id == material_id))
    mat = result.scalar_one_or_none()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
        
    await db.delete(mat)
    await db.commit()
    return {"message": "Material deleted successfully", "id": material_id}
