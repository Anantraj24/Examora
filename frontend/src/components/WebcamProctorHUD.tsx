import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, ShieldAlert, Eye, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { ProctorTelemetry } from '../types';
import { aiVisionEngine, FaceDetectionResult } from '../services/aiVisionProctor';
import { api } from '../services/api';

interface WebcamProctorHUDProps {
  sessionId: string;
  onViolation?: (message: string) => void;
  onTelemetrySent?: (telemetry: ProctorTelemetry) => void;
}

export type CameraStatus = 'requesting' | 'active' | 'denied' | 'unavailable';

export const WebcamProctorHUD: React.FC<WebcamProctorHUDProps> = ({
  sessionId,
  onViolation,
  onTelemetrySent,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Optical & Proctoring States
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('requesting');
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [gazeDirection, setGazeDirection] = useState<'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'OFF_SCREEN'>('CENTER');
  const [gazeScore, setGazeScore] = useState(0.05);
  const [tabHidden, setTabHidden] = useState(false);
  const [, setSuspicionScore] = useState(0);
  const [lastWarning, setLastWarning] = useState<string | null>(null);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [detectionEngineName, setDetectionEngineName] = useState('Optical Sensor Initializing...');
  const [isWarmingUp, setIsWarmingUp] = useState(true);

  // Manual Simulation Overrides (For Testing Environments)
  const [simulatedFaceAbsent, setSimulatedFaceAbsent] = useState(false);
  const [simulatedMultiFace, setSimulatedMultiFace] = useState(false);
  const [simulatedGazeAway, setSimulatedGazeAway] = useState(false);

  // Consecutive anomaly counters to prevent single-frame flickering
  const noFaceFramesRef = useRef<number>(0);
  const multiFaceFramesRef = useRef<number>(0);
  const gazeAwayFramesRef = useRef<number>(0);

  // Keep latest state in ref for persistent 10-second telemetry heartbeat without timer thrashing
  const latestTelemetryRef = useRef({
    faceDetected,
    faceCount,
    gazeDirection,
    gazeScore,
    tabHidden,
    cameraStatus
  });

  useEffect(() => {
    latestTelemetryRef.current = {
      faceDetected,
      faceCount,
      gazeDirection,
      gazeScore,
      tabHidden,
      cameraStatus
    };
  }, [faceDetected, faceCount, gazeDirection, gazeScore, tabHidden, cameraStatus]);

  const triggerViolation = useCallback((msg: string) => {
    setLastWarning(msg);
    setWarningModalOpen(true);
    if (onViolation) onViolation(msg);
  }, [onViolation]);

  // 1. Initialize Webcam Stream (Lifecycle Controlled, No Re-creation Loops)
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      setCameraStatus('requesting');
      setDetectionEngineName('Requesting Camera Access...');

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API not supported');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        // Listen for hardware disconnection
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            if (isMounted) {
              setCameraStatus('unavailable');
              setFaceDetected(false);
              setFaceCount(0);
              setDetectionEngineName('Webcam Disconnected');
              triggerViolation('Webcam disconnected. A functional camera stream is required for proctoring.');
            }
          };
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (isMounted && videoRef.current) {
              videoRef.current.play().catch(console.warn);
              setCameraStatus('active');
              setDetectionEngineName('Vision Edge Active');
            }
          };
        }
      } catch (err: any) {
        console.warn('[WebcamProctorHUD] Camera error:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraStatus('denied');
            setDetectionEngineName('Camera Permission Denied');
            triggerViolation('Webcam permission denied. Video monitoring is mandatory during examination.');
          } else {
            setCameraStatus('unavailable');
            setDetectionEngineName('Camera Unavailable');
            triggerViolation('No active webcam found. Please connect an optical camera to proceed.');
          }
          setFaceDetected(false);
          setFaceCount(0);
        }
      }
    }

    initCamera();

    // 2.5 second startup grace period before triggering face absence violations
    const warmupTimer = setTimeout(() => {
      if (isMounted) setIsWarmingUp(false);
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(warmupTimer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          t.stop();
          t.enabled = false;
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [triggerViolation]);

  // 2. Real-Time Detection Loop (~280ms cycle)
  useEffect(() => {
    let animationFrameId: number;
    let lastProcessTime = 0;
    const processInterval = 280;

    const drawHUD = (res: FaceDetectionResult, vw: number, vh: number) => {
      const hudCanvas = hudCanvasRef.current;
      if (!hudCanvas) return;
      const ctx = hudCanvas.getContext('2d');
      if (!ctx) return;

      if (hudCanvas.width !== vw || hudCanvas.height !== vh) {
        hudCanvas.width = vw;
        hudCanvas.height = vh;
      }

      ctx.clearRect(0, 0, vw, vh);

      if (!res.faceDetected) {
        // Red Alert Screen Perimeter
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, vw - 8, vh - 8);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NO CANDIDATE DETECTED', vw / 2, vh / 2);
        return;
      }

      const box = res.boundingBox || {
        x: vw * 0.25,
        y: vh * 0.2,
        width: vw * 0.5,
        height: vh * 0.6
      };

      const isAlert = res.faceCount > 1 || res.gazeDirection !== 'CENTER';
      const themeColor = res.faceCount > 1
        ? '#EF4444'
        : res.gazeDirection !== 'CENTER'
          ? '#F59E0B'
          : '#10B981';

      // Corner tick brackets
      const bx = Math.max(4, Math.min(vw - box.width - 4, box.x));
      const by = Math.max(4, Math.min(vh - box.height - 4, box.y));
      const bw = Math.min(vw - bx - 4, box.width);
      const bh = Math.min(vh - by - 4, box.height);
      const tickLen = Math.min(16, bw * 0.2, bh * 0.2);

      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2.5;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + tickLen);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + tickLen, by);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - tickLen, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by + tickLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - tickLen);
      ctx.lineTo(bx, by + bh);
      ctx.lineTo(bx + tickLen, by + bh);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - tickLen, by + bh);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx + bw, by + bh - tickLen);
      ctx.stroke();

      // Landmarks if available
      if (res.landmarks && res.landmarks.length > 0) {
        ctx.fillStyle = themeColor;
        for (const lm of res.landmarks) {
          ctx.beginPath();
          ctx.arc(lm.x, lm.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Tag Overlay
      ctx.fillStyle = themeColor;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      const labelText = isAlert
        ? res.faceCount > 1 ? `ALERT: ${res.faceCount} PERSONS` : `GAZE: ${res.gazeDirection}`
        : `VERIFIED [${Math.round((res.confidence || 0.95) * 100)}%]`;
      ctx.fillText(labelText, bx + 2, Math.max(12, by - 4));
    };

    const processLoop = async (timestamp: number) => {
      if (timestamp - lastProcessTime >= processInterval) {
        lastProcessTime = timestamp;

        if (cameraStatus === 'active' && videoRef.current && videoRef.current.videoWidth > 0) {
          try {
            const rawRes = await aiVisionEngine.analyzeFrame(videoRef.current);

            // Apply manual simulation modifiers if activated by test controls
            let effFaceDetected = rawRes.faceDetected;
            let effFaceCount = rawRes.faceCount;
            let effGaze = rawRes.gazeDirection;
            let effGazeScore = rawRes.gazeScore;

            if (simulatedFaceAbsent) {
              effFaceDetected = false;
              effFaceCount = 0;
              effGaze = 'OFF_SCREEN';
              effGazeScore = 0.95;
            } else if (simulatedMultiFace) {
              effFaceDetected = true;
              effFaceCount = Math.max(2, rawRes.faceCount + 1);
            }

            if (simulatedGazeAway) {
              effGaze = 'OFF_SCREEN';
              effGazeScore = 0.85;
            }

            setFaceDetected(effFaceDetected);
            setFaceCount(effFaceCount);
            setGazeDirection(effGaze);
            setGazeScore(effGazeScore);

            drawHUD({
              ...rawRes,
              faceDetected: effFaceDetected,
              faceCount: effFaceCount,
              gazeDirection: effGaze,
              gazeScore: effGazeScore
            }, videoRef.current.clientWidth || 320, videoRef.current.clientHeight || 240);

            // Anomaly tracking with debouncing (only after warmup period)
            if (!isWarmingUp) {
              if (!effFaceDetected) {
                noFaceFramesRef.current += 1;
                if (noFaceFramesRef.current === 7) { // ~2 seconds absent
                  triggerViolation('No candidate face detected in webcam view. Please face your screen directly.');
                }
              } else {
                noFaceFramesRef.current = 0;
              }

              if (effFaceCount > 1) {
                multiFaceFramesRef.current += 1;
                if (multiFaceFramesRef.current === 4) { // ~1.2 seconds
                  triggerViolation(`Multiple persons detected (${effFaceCount} faces visible). Integrity violation flagged.`);
                }
              } else {
                multiFaceFramesRef.current = 0;
              }

              if (effGaze !== 'CENTER') {
                gazeAwayFramesRef.current += 1;
                if (gazeAwayFramesRef.current === 8) { // ~2.4 seconds
                  triggerViolation(`Gaze deflected (${effGaze}). Please maintain focus on the exam questions.`);
                }
              } else {
                gazeAwayFramesRef.current = 0;
              }
            }
          } catch (err) {
            console.warn('[WebcamProctorHUD] Frame analysis error:', err);
          }
        }
      }

      animationFrameId = requestAnimationFrame(processLoop);
    };

    animationFrameId = requestAnimationFrame(processLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraStatus, isWarmingUp, simulatedFaceAbsent, simulatedMultiFace, simulatedGazeAway, triggerViolation]);

  // 3. Tab Visibility & Window Blur Tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabHidden(true);
        triggerViolation('Warning: Switching browser tabs or minimizing the examination window is recorded as a violation.');
      } else {
        setTabHidden(false);
      }
    };

    const handleBlur = () => {
      setTabHidden(true);
    };

    const handleFocus = () => {
      setTabHidden(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [triggerViolation]);

  // 4. WebSocket Heartbeat Connection
  useEffect(() => {
    if (!sessionId) return;
    const defaultWsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let baseWsUrl = import.meta.env.VITE_WS_BASE_URL as string | undefined;
    if (!baseWsUrl) {
      const apiEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
      if (apiEnv) {
        try {
          const parsed = new URL(apiEnv);
          baseWsUrl = `${parsed.protocol === 'https:' ? 'wss:' : 'ws:'}//${parsed.host}`;
        } catch {
          baseWsUrl = `${defaultWsProtocol}//localhost:8000`;
        }
      } else {
        baseWsUrl = `${defaultWsProtocol}//localhost:8000`;
      }
    }
    const wsUrl = `${baseWsUrl.replace(/\/$/, '')}/api/v1/proctoring/ws/proctor/${sessionId}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);
          if (res.current_suspicion_score !== undefined) {
            setSuspicionScore(res.current_suspicion_score);
          }
          if (res.warning_message) {
            triggerViolation(res.warning_message);
          }
        } catch (e) {
          console.error('[WebcamProctorHUD] WS Message parse error:', e);
        }
      };
    } catch (e) {
      console.warn('[WebcamProctorHUD] WebSocket initialization fallback:', e);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [sessionId, triggerViolation]);

  const captureSnapshot = (): string | undefined => {
    if (!videoRef.current || !canvasRef.current) return undefined;
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && videoRef.current.videoWidth > 0) {
        canvas.width = 320;
        canvas.height = 240;
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        return canvas.toDataURL('image/jpeg', 0.6);
      }
    } catch (e) {
      console.warn('[WebcamProctorHUD] Error capturing snapshot', e);
    }
    return undefined;
  };

  // 5. Stable 10-Second Telemetry Heartbeat (No duplicate timers or frame restarts)
  useEffect(() => {
    const interval = setInterval(async () => {
      const current = latestTelemetryRef.current;
      const snapshot = captureSnapshot();

      // If camera is denied or offline, explicitly record face as not detected
      const isCameraActive = current.cameraStatus === 'active';
      const finalFaceDetected = isCameraActive ? current.faceDetected : false;
      const finalFaceCount = isCameraActive ? current.faceCount : 0;

      const telemetry: ProctorTelemetry = {
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        face_detected: finalFaceDetected,
        face_count: finalFaceCount,
        gaze_direction: current.gazeDirection,
        gaze_score: current.gazeScore,
        tab_hidden: current.tabHidden,
        window_blurred: current.tabHidden,
        snapshot_base64: snapshot
      };

      // 1. Send via WebSocket if connected
      let wsSent = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify(telemetry));
          wsSent = true;
        } catch {
          wsSent = false;
        }
      }

      // 2. Dual fallback: Record via REST if WS is unavailable or during violations
      if (!wsSent || !finalFaceDetected || finalFaceCount > 1 || current.tabHidden) {
        api.sendProctorTelemetry(telemetry).catch(() => {});
      }

      if (onTelemetrySent) {
        onTelemetrySent(telemetry);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [sessionId, onTelemetrySent]);

  // Status Evaluation
  const isCameraHealthy = cameraStatus === 'active';
  const isFaceOk = faceDetected && faceCount === 1;
  const isGazeOk = gazeDirection === 'CENTER';
  const isOk = isCameraHealthy && isFaceOk && isGazeOk && !tabHidden;

  const getStatusBadge = () => {
    if (cameraStatus === 'requesting') {
      return { text: 'Initializing Camera...', color: '#60A5FA', dot: '#3B82F6' };
    }
    if (cameraStatus === 'denied') {
      return { text: 'Camera Denied', color: '#FDA4AF', dot: '#EF4444' };
    }
    if (cameraStatus === 'unavailable') {
      return { text: 'Camera Offline', color: '#FDA4AF', dot: '#EF4444' };
    }
    if (!faceDetected) {
      return { text: 'Candidate Absent', color: '#FDA4AF', dot: '#EF4444' };
    }
    if (faceCount > 1) {
      return { text: `${faceCount} Faces Detected`, color: '#FDA4AF', dot: '#EF4444' };
    }
    if (!isGazeOk) {
      return { text: `Gaze ${gazeDirection}`, color: '#FCD34D', dot: '#F59E0B' };
    }
    if (tabHidden) {
      return { text: 'Window Blurred', color: '#FCD34D', dot: '#F59E0B' };
    }
    return { text: 'AI Proctor: Clear', color: '#6EE7B7', dot: '#10B981' };
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      <div className="glass-panel" style={{
        padding: '0.75rem',
        width: '260px',
        position: 'relative',
        boxShadow: isOk ? 'var(--shadow-md)' : '0 0 20px rgba(239, 68, 68, 0.4)',
        borderColor: isOk ? 'var(--border-subtle)' : 'var(--accent-rose)'
      }}>
        {/* Header Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: statusBadge.dot,
              display: 'inline-block',
              boxShadow: `0 0 6px ${statusBadge.dot}`
            }} />
            <span style={{ fontWeight: 700, color: statusBadge.color }}>
              {statusBadge.text}
            </span>
          </div>
          <span className="font-mono" style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            {detectionEngineName}
          </span>
        </div>

        {/* Video Canvas Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '140px',
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: cameraStatus === 'active' ? 'block' : 'none'
            }}
          />

          {/* AI HUD Overlay Canvas */}
          <canvas
            ref={hudCanvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              transform: 'scaleX(-1)',
              display: cameraStatus === 'active' ? 'block' : 'none'
            }}
          />

          {/* Fallback Screen for Requesting / Denied / Offline Camera */}
          {cameraStatus !== 'active' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.95)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              textAlign: 'center',
              padding: '0.75rem',
              gap: '6px'
            }}>
              {cameraStatus === 'requesting' && (
                <>
                  <RefreshCw size={22} className="animate-spin" color="#6366F1" />
                  <span style={{ color: '#E2E8F0', fontWeight: 600 }}>Initializing Optical Feed...</span>
                </>
              )}
              {cameraStatus === 'denied' && (
                <>
                  <CameraOff size={24} color="#EF4444" />
                  <span style={{ color: '#FCA5A5', fontWeight: 700 }}>Camera Permission Denied</span>
                  <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Allow webcam access in browser bar</span>
                </>
              )}
              {cameraStatus === 'unavailable' && (
                <>
                  <AlertCircle size={24} color="#F59E0B" />
                  <span style={{ color: '#FCD34D', fontWeight: 700 }}>No Webcam Detected</span>
                  <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Connect an optical camera to resume</span>
                </>
              )}
            </div>
          )}

          {/* Real-Time Detection Telemetry Pill */}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '6px',
            right: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(4px)'
          }}>
            <span style={{ color: isFaceOk ? '#6EE7B7' : '#FDA4AF', fontWeight: 600 }}>
              Face: {faceCount === 0 ? 'None' : `${faceCount} detected`}
            </span>
            <span style={{ color: isGazeOk ? '#6EE7B7' : '#FCD34D', fontWeight: 600 }}>
              Gaze: {gazeDirection}
            </span>
          </div>
        </div>

        {/* Hidden Canvas for JPEG Snapshots */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Interactive Simulation Controls (For QA, Testing & Live Demos) */}
        <div style={{
          marginTop: '0.6rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px'
        }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.63rem', padding: '3px 4px' }}
            onClick={() => setSimulatedGazeAway(prev => !prev)}
          >
            <Eye size={11} />
            {simulatedGazeAway ? 'Reset Gaze' : 'Gaze Away'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.63rem', padding: '3px 4px' }}
            onClick={() => setSimulatedFaceAbsent(prev => !prev)}
          >
            <Camera size={11} />
            {simulatedFaceAbsent ? 'Restore Face' : 'Absent Face'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.63rem', padding: '3px 4px' }}
            onClick={() => setSimulatedMultiFace(prev => !prev)}
          >
            <Users size={11} />
            {simulatedMultiFace ? 'Single Face' : '+1 Person'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.63rem', padding: '3px 4px' }}
            onClick={() => {
              setCameraStatus(prev => prev === 'active' ? 'denied' : 'active');
              if (cameraStatus === 'active') {
                setFaceDetected(false);
                setFaceCount(0);
                triggerViolation('Camera disconnected by user action.');
              }
            }}
          >
            <CameraOff size={11} />
            {cameraStatus === 'active' ? 'Block Cam' : 'Enable Cam'}
          </button>
        </div>
      </div>

      {/* Proctoring Warning Modal */}
      {warningModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '2rem',
            textAlign: 'center',
            border: '2px solid var(--accent-rose)',
            boxShadow: 'var(--shadow-glow-rose)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}>
              <ShieldAlert size={32} color="#EF4444" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#F87171' }}>
              Proctoring Integrity Alert
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {lastWarning || 'An environment anomaly (camera obstruction, candidate absence, or window defocus) was detected.'}
            </p>
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.08)',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#FCA5A5',
              marginBottom: '1.5rem'
            }}>
              Persistent anomalies are timestamped with telemetry snapshots and submitted for manual examiner audit.
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => setWarningModalOpen(false)}
            >
              I Understand, Return to Exam
            </button>
          </div>
        </div>
      )}
    </>
  );
};
