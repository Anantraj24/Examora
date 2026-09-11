import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, ShieldAlert, Eye, Users } from 'lucide-react';
import { ProctorTelemetry } from '../types';
import { aiVisionEngine, FaceDetectionResult } from '../services/aiVisionProctor';

interface WebcamProctorHUDProps {
  sessionId: string;
  onViolation?: (message: string) => void;
  onTelemetrySent?: (telemetry: ProctorTelemetry) => void;
}

export const WebcamProctorHUD: React.FC<WebcamProctorHUDProps> = ({
  sessionId,
  onViolation,
  onTelemetrySent,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);
  const [faceCount, setFaceCount] = useState(1);
  const [gazeDirection, setGazeDirection] = useState<'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'OFF_SCREEN'>('CENTER');
  const [gazeScore, setGazeScore] = useState(0.05);
  const [tabHidden, setTabHidden] = useState(false);
  const [, setSuspicionScore] = useState(0);
  const [lastWarning, setLastWarning] = useState<string | null>(null);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [detectionEngineName, setDetectionEngineName] = useState('AI Vision Active');

  // Consecutive anomaly counters to prevent single-frame flickering warnings
  const noFaceFramesRef = useRef<number>(0);
  const multiFaceFramesRef = useRef<number>(0);
  const gazeAwayFramesRef = useRef<number>(0);

  const triggerViolation = useCallback((msg: string) => {
    setLastWarning(msg);
    setWarningModalOpen(true);
    if (onViolation) onViolation(msg);
  }, [onViolation]);

  // 1. Initialize Webcam Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        });
        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.warn);
          };
          setHasCamera(true);
          setDetectionEngineName('Vision Edge Model');
        }
      } catch (err) {
        console.warn('Webcam permission denied or unavailable, using simulated stream', err);
        if (isMounted) {
          setHasCamera(false);
          setDetectionEngineName('Simulation Mode');
        }
      }
    }
    initCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 2. Real-Time AI Camera Detection Loop (~300ms cycle)
  useEffect(() => {
    let animationFrameId: number;
    let lastProcessTime = 0;
    const processInterval = 280; // Run AI detection ~3.5 times per second

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
        // Draw Red Alert Screen Perimeter
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, vw - 8, vh - 8);

        // Warning Label
        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NO CANDIDATE DETECTED', vw / 2, vh / 2);
        return;
      }

      // Determine bounding box coordinates
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

      // Draw Tech Bounding Brackets (Corner ticks)
      const bx = Math.max(4, Math.min(vw - box.width - 4, box.x));
      const by = Math.max(4, Math.min(vh - box.height - 4, box.y));
      const bw = Math.min(vw - bx - 4, box.width);
      const bh = Math.min(vh - by - 4, box.height);
      const tickLen = Math.min(16, bw * 0.2, bh * 0.2);

      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2.5;

      // Top-Left Corner
      ctx.beginPath();
      ctx.moveTo(bx, by + tickLen);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + tickLen, by);
      ctx.stroke();

      // Top-Right Corner
      ctx.beginPath();
      ctx.moveTo(bx + bw - tickLen, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by + tickLen);
      ctx.stroke();

      // Bottom-Left Corner
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - tickLen);
      ctx.lineTo(bx, by + bh);
      ctx.lineTo(bx + tickLen, by + bh);
      ctx.stroke();

      // Bottom-Right Corner
      ctx.beginPath();
      ctx.moveTo(bx + bw - tickLen, by + bh);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx + bw, by + bh - tickLen);
      ctx.stroke();

      // Draw Landmarks / Eye dots if available
      if (res.landmarks && res.landmarks.length > 0) {
        ctx.fillStyle = themeColor;
        for (const lm of res.landmarks) {
          ctx.beginPath();
          ctx.arc(lm.x, lm.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Detection Tag Overlay
      ctx.fillStyle = themeColor;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      const labelText = isAlert
        ? res.faceCount > 1 ? `ALERT: ${res.faceCount} FACES` : `GAZE: ${res.gazeDirection}`
        : `VERIFIED [${Math.round((res.confidence || 0.95) * 100)}%]`;
      ctx.fillText(labelText, bx + 2, Math.max(12, by - 4));
    };

    const processLoop = async (timestamp: number) => {
      if (timestamp - lastProcessTime >= processInterval && videoRef.current && hasCamera) {
        lastProcessTime = timestamp;
        try {
          const video = videoRef.current;
          if (video.videoWidth > 0) {
            const res = await aiVisionEngine.analyzeFrame(video);

            setFaceDetected(res.faceDetected);
            setFaceCount(res.faceCount);
            setGazeDirection(res.gazeDirection);
            setGazeScore(res.gazeScore);

            drawHUD(res, video.clientWidth || 320, video.clientHeight || 240);

            // Anomaly tracking logic with debounce (to avoid momentary blink triggers)
            if (!res.faceDetected) {
              noFaceFramesRef.current += 1;
              if (noFaceFramesRef.current === 6) { // ~2 seconds absent
                triggerViolation('No face detected in webcam view. Please face your screen directly.');
              }
            } else {
              noFaceFramesRef.current = 0;
            }

            if (res.faceCount > 1) {
              multiFaceFramesRef.current += 1;
              if (multiFaceFramesRef.current === 4) {
                triggerViolation('Multiple people detected in candidate webcam view. Integrity flag logged.');
              }
            } else {
              multiFaceFramesRef.current = 0;
            }

            if (res.gazeDirection !== 'CENTER') {
              gazeAwayFramesRef.current += 1;
              if (gazeAwayFramesRef.current === 7) { // ~2.5 seconds looking away
                triggerViolation(`Gaze deflected (${res.gazeDirection}). Please focus on the exam screen.`);
              }
            } else {
              gazeAwayFramesRef.current = 0;
            }
          }
        } catch (err) {
          console.warn('[WebcamProctorHUD] Frame analysis err:', err);
        }
      }
      animationFrameId = requestAnimationFrame(processLoop);
    };

    animationFrameId = requestAnimationFrame(processLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasCamera, triggerViolation]);

  // 3. Tab Visibility & Window Blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabHidden(true);
        triggerViolation('Warning: Switching browser tabs or minimizing the exam window is strictly recorded.');
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

  // 4. WebSocket Heartbeat Stream
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
        } catch (e) {
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
          console.error(e);
        }
      };
    } catch (e) {
      console.warn('WS not connectable in standalone mode', e);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
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
      console.warn('Error capturing snapshot', e);
    }
    return undefined;
  };

  // 5. 10-Second Telemetry Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      const snapshot = captureSnapshot();
      const telemetry: ProctorTelemetry = {
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        face_detected: faceDetected,
        face_count: faceCount,
        gaze_direction: gazeDirection,
        gaze_score: gazeScore,
        tab_hidden: tabHidden,
        window_blurred: tabHidden,
        snapshot_base64: snapshot
      };

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(telemetry));
      }

      if (onTelemetrySent) {
        onTelemetrySent(telemetry);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [sessionId, faceDetected, faceCount, gazeDirection, gazeScore, tabHidden, onTelemetrySent]);

  // Overall status check
  const isOk = faceDetected && faceCount === 1 && gazeDirection === 'CENTER' && !tabHidden;

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
              background: isOk ? '#10B981' : '#EF4444',
              display: 'inline-block',
              boxShadow: isOk ? '0 0 6px #10B981' : '0 0 6px #EF4444'
            }} />
            <span style={{ fontWeight: 700, color: isOk ? '#6EE7B7' : '#FDA4AF' }}>
              {isOk ? 'AI Proctor: Clear' : 'Anomaly Detected'}
            </span>
          </div>
          <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
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
              transform: 'scaleX(-1)'
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
              transform: 'scaleX(-1)'
            }}
          />

          {!hasCamera && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.9)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              textAlign: 'center',
              padding: '0.5rem'
            }}>
              <Camera size={24} style={{ marginBottom: '4px', opacity: 0.7 }} />
              <span>Simulated AI Stream Active</span>
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
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)'
          }}>
            <span style={{ color: faceDetected ? '#6EE7B7' : '#FDA4AF', fontWeight: 600 }}>
              Face: {faceCount === 0 ? 'None' : `${faceCount} detected`}
            </span>
            <span style={{ color: gazeDirection === 'CENTER' ? '#6EE7B7' : '#FCD34D', fontWeight: 600 }}>
              Gaze: {gazeDirection}
            </span>
          </div>
        </div>

        {/* Hidden Canvas for JPEG Snapshots */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Interactive Simulation Controls (For Live Demo & Testing) */}
        <div style={{
          marginTop: '0.6rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.65rem', padding: '3px 6px', flex: 1 }}
            onClick={() => {
              setGazeDirection(prev => {
                const next = prev === 'CENTER' ? 'OFF_SCREEN' : 'CENTER';
                setGazeScore(next === 'CENTER' ? 0.05 : 0.65);
                return next;
              });
            }}
          >
            <Eye size={12} />
            {gazeDirection === 'CENTER' ? 'Simulate Gaze Away' : 'Reset Gaze'}
          </button>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.65rem', padding: '3px 6px', flex: 1 }}
            onClick={() => {
              setFaceCount(prev => prev === 1 ? 2 : 1);
            }}
          >
            <Users size={12} />
            {faceCount === 1 ? 'Simulate +1 Face' : 'Single Face'}
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
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {lastWarning || 'A violation signal (off-screen gaze, face absence, or tab change) was logged by the AI Proctoring Engine.'}
            </p>
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.08)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#FCA5A5',
              marginBottom: '1.5rem'
            }}>
              Continuous violations will automatically flag your session for manual examiner review.
            </div>
            <button
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
