import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db, AsyncSessionLocal
from app.models.models import ExamSession, ProctorEvent, SessionStatus, UserRole, Exam
from app.schemas.schemas import ProctorTelemetryPayload, ProctorHeartbeatResponse
from app.services.proctor_scorer import compute_telemetry_suspicion

logger = logging.getLogger("proctoring_ws")
router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # session_id -> student websocket
        self.active_sessions: Dict[str, WebSocket] = {}
        # set of examiner / admin websockets for live broadcast
        self.proctor_observers: Set[WebSocket] = set()

    async def connect_session(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_sessions[session_id] = websocket

    def disconnect_session(self, session_id: str):
        self.active_sessions.pop(session_id, None)

    async def connect_observer(self, websocket: WebSocket):
        await websocket.accept()
        self.proctor_observers.add(websocket)

    def disconnect_observer(self, websocket: WebSocket):
        self.proctor_observers.discard(websocket)

    async def broadcast_alert_to_observers(self, alert_data: dict):
        dead_conns = []
        for ws in self.proctor_observers:
            try:
                await ws.send_text(json.dumps(alert_data))
            except Exception:
                dead_conns.append(ws)
        for dead in dead_conns:
            self.proctor_observers.discard(dead)

manager = ConnectionManager()

@router.websocket("/ws/proctor/{session_id}")
async def proctoring_telemetry_ws(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for 10-second client-side proctoring telemetry heartbeats.
    """
    await manager.connect_session(session_id, websocket)
    try:
        while True:
            raw_text = await websocket.receive_text()
            data = json.loads(raw_text)
            payload = ProctorTelemetryPayload(**data)
            
            async with AsyncSessionLocal() as db:
                sess_query = select(ExamSession).options(
                    selectinload(ExamSession.student), selectinload(ExamSession.exam)
                ).where(ExamSession.id == session_id)
                session = (await db.execute(sess_query)).scalar_one_or_none()
                
                if not session:
                    await websocket.send_text(json.dumps({"error": "Session not found"}))
                    continue
                    
                new_score, new_tabs, events, snapshot_path = compute_telemetry_suspicion(
                    payload=payload,
                    current_score=session.final_suspicion_score,
                    current_tab_switches=session.total_tab_switches
                )
                
                session.final_suspicion_score = new_score
                session.total_tab_switches = new_tabs
                
                # If high suspicion, flag session status
                if new_score >= 80.0 and session.status == SessionStatus.IN_PROGRESS:
                    session.status = SessionStatus.FLAGGED
                    
                # Record individual events in DB
                for ev in events:
                    db_event = ProctorEvent(
                        session_id=session.id,
                        event_type=ev["event_type"],
                        suspicion_delta=ev["suspicion_delta"],
                        snapshot_path=snapshot_path,
                        raw_telemetry={
                            "gaze_direction": payload.gaze_direction,
                            "gaze_score": payload.gaze_score,
                            "face_count": payload.face_count,
                            "tab_hidden": payload.tab_hidden,
                            "window_blurred": payload.window_blurred,
                            "message": ev["message"]
                        }
                    )
                    db.add(db_event)
                    
                await db.commit()
                
                # Send feedback back to client HUD
                warning_msg = None
                if events:
                    warning_msg = events[-1]["message"]
                    
                resp = ProctorHeartbeatResponse(
                    status="acknowledged",
                    current_suspicion_score=new_score,
                    violations_count=len(events),
                    warning_message=warning_msg
                )
                await websocket.send_text(resp.model_dump_json())
                
                # If violation occurred, broadcast live alert to proctor observers
                if events:
                    alert_payload = {
                        "type": "PROCTOR_ALERT",
                        "session_id": session.id,
                        "student_name": session.student.full_name if session.student else "Candidate",
                        "exam_title": session.exam.title if session.exam else "Exam",
                        "suspicion_score": new_score,
                        "events": events,
                        "snapshot_path": snapshot_path,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                    await manager.broadcast_alert_to_observers(alert_payload)
                    
    except WebSocketDisconnect:
        manager.disconnect_session(session_id)
    except Exception as e:
        logger.error(f"WebSocket error in proctor stream: {e}")
        manager.disconnect_session(session_id)

@router.websocket("/ws/proctor-live-feed")
async def proctor_live_feed_ws(websocket: WebSocket):
    """
    Observer WebSocket endpoint for Examiners/Proctors to receive real-time incident broadcasts.
    """
    await manager.connect_observer(websocket)
    try:
        while True:
            # Keep-alive ping
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_observer(websocket)
    except Exception:
        manager.disconnect_observer(websocket)

@router.get("/events/{session_id}")
async def get_proctor_events(session_id: str, db: AsyncSession = Depends(get_db)):
    query = select(ProctorEvent).where(ProctorEvent.session_id == session_id).order_by(ProctorEvent.timestamp.desc())
    events = (await db.execute(query)).scalars().all()
    return events

@router.get("/live-overview")
async def get_live_proctoring_overview(db: AsyncSession = Depends(get_db)):
    """
    Provides real-time aggregated metrics for the proctoring dashboard.
    """
    query = select(ExamSession).options(
        selectinload(ExamSession.student),
        selectinload(ExamSession.exam)
    ).order_by(ExamSession.started_at.desc())
    
    sessions = (await db.execute(query)).scalars().all()
    
    active_list = []
    for s in sessions:
        active_list.append({
            "session_id": s.id,
            "student_name": s.student.full_name if s.student else "Candidate",
            "student_email": s.student.email if s.student else "",
            "exam_title": s.exam.title if s.exam else "Exam",
            "status": s.status,
            "suspicion_score": s.final_suspicion_score,
            "tab_switches": s.total_tab_switches,
            "started_at": s.started_at,
            "server_deadline": s.server_deadline
        })
        
    return {
        "total_active_sessions": sum(1 for s in sessions if s.status == SessionStatus.IN_PROGRESS),
        "total_flagged_sessions": sum(1 for s in sessions if s.final_suspicion_score >= 60.0),
        "sessions": active_list
    }
