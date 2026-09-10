import os
import base64
import uuid
from datetime import datetime
from typing import Tuple, List, Dict, Any, Optional
from app.core.config import settings
from app.schemas.schemas import ProctorTelemetryPayload

def save_base64_snapshot(base64_str: str, session_id: str) -> Optional[str]:
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        img_bytes = base64.b64decode(base64_str)
        filename = f"{session_id}_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(settings.SNAPSHOT_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(img_bytes)
        return filepath
    except Exception:
        return None

def compute_telemetry_suspicion(
    payload: ProctorTelemetryPayload, 
    current_score: float,
    current_tab_switches: int
) -> Tuple[float, int, List[Dict[str, Any]], Optional[str]]:
    """
    Evaluates 10-second heartbeat telemetry from client edge ML detector.
    Returns:
      (new_suspicion_score, new_tab_switches, triggered_events, snapshot_path)
    """
    triggered_events = []
    suspicion_delta = 0.0
    snapshot_path = None
    new_tab_switches = current_tab_switches
    
    # 1. Face Absence Verification
    if not payload.face_detected or payload.face_count == 0:
        suspicion_delta += settings.FACE_ABSENCE_PENALTY_RATE
        triggered_events.append({
            "event_type": "FACE_ABSENT",
            "suspicion_delta": settings.FACE_ABSENCE_PENALTY_RATE,
            "message": "Candidate face not visible in webcam stream."
        })
        
    # 2. Multiple Face Detection
    elif payload.face_count > 1:
        suspicion_delta += settings.MULTI_FACE_PENALTY
        triggered_events.append({
            "event_type": "MULTI_FACE",
            "suspicion_delta": settings.MULTI_FACE_PENALTY,
            "message": f"Multiple persons detected ({payload.face_count} faces visible)."
        })
        
    # 3. Gaze Direction & Eye Tracking Anomaly
    if payload.face_detected and payload.face_count == 1 and payload.gaze_direction:
        gaze_dir = payload.gaze_direction.upper().strip()
        if gaze_dir in ["OFF_SCREEN", "LEFT", "RIGHT", "DOWN", "UP", "AWAY"] and payload.gaze_score >= settings.GAZE_OUT_OF_BOUNDS_THRESHOLD:
            gaze_penalty = 8.0
            suspicion_delta += gaze_penalty
            triggered_events.append({
                "event_type": "GAZE_AWAY",
                "suspicion_delta": gaze_penalty,
                "message": f"Off-screen gaze divergence detected ({payload.gaze_direction})."
            })
            
    # 4. Tab / Window Visibility Change
    if payload.tab_hidden or payload.window_blurred:
        new_tab_switches += 1
        suspicion_delta += settings.TAB_SWITCH_PENALTY
        triggered_events.append({
            "event_type": "TAB_BLUR",
            "suspicion_delta": settings.TAB_SWITCH_PENALTY,
            "message": f"Browser tab or window focus lost (Total switches: {new_tab_switches})."
        })

    # Save snapshot if violation occurred and image provided
    if triggered_events and payload.snapshot_base64:
        snapshot_path = save_base64_snapshot(payload.snapshot_base64, payload.session_id)

    # Calculate new bounded suspicion score (0.0 to 100.0)
    new_score = min(100.0, max(0.0, current_score + suspicion_delta))
    
    return new_score, new_tab_switches, triggered_events, snapshot_path
