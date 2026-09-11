import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.init_db import init_db
from app.core.scheduler import start_scheduler, shutdown_scheduler
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background DB verification task so HTTP worker binds immediately
    print("[INFO] Examora Engine Booting...")
    asyncio.create_task(init_db())
    
    # Start background scheduler safely
    try:
        print("[INFO] Starting APScheduler daemon...")
        start_scheduler()
    except Exception as e:
        print(f"[WARNING] Scheduler startup encountered non-fatal error: {e}")
        
    yield
    
    # Shutdown
    print("[INFO] Shutting down APScheduler...")
    try:
        shutdown_scheduler()
    except Exception:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory for images and snapshots
if os.path.exists("./uploads"):
    app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

# Mount API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.head("/")
@app.head("/health")
async def head_health():
    return Response(status_code=200)

@app.get("/health")
async def health():
    return {"status": "healthy"}
