import React, { useEffect, useRef, useState } from 'react';
import { Camera, ShieldAlert, CheckCircle, AlertTriangle, Eye, Users } from 'lucide-react';
import { ProctorTelemetry } from '../types';

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
  const wsRef = useRef<WebSocket | null>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);
  const [faceCount, setFaceCount] = useState(1);
  const [gazeDirection, setGazeDirection] = useState<'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'OFF_SCREEN'>('CENTER');
  const [tabHidden, setTabHidden] = useState(false);
  const [suspicionScore, setSuspicionScore] = useState(0);
  const [lastWarning, setLastWarning] = useState<string | null>(null);
  const [warningModalOpen, setWarningModalOpen] = useState(false);

  // Initialize Webcam Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCamera(true);
        }
      } catch (err) {
        console.warn('Webcam permission denied or not available, using simulated stream', err);
        setHasCamera(false);
      }
    }
    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Listen to browser tab visibility and window blur events
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
  }, []);

  // Initialize WebSocket Heartbeat Stream
  useEffect(() => {
    if (!sessionId) return;
    const wsUrl = `ws://localhost:8000/api/v1/proctoring/ws/proctor/${sessionId}`;
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
  }, [sessionId]);

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

  const triggerViolation = (msg: string) => {
    setLastWarning(msg);
    setWarningModalOpen(true);
    if (onViolation) onViolation(msg);
  };

  // 10-Second Telemetry Heartbeat Interval
  useEffect(() => {
    const interval = setInterval(() => {
      const snapshot = captureSnapshot();
      const telemetry: ProctorTelemetry = {
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        face_detected: faceDetected,
        face_count: faceCount,
        gaze_direction: gazeDirection,
        gaze_score: gazeDirection === 'CENTER' ? 0.05 : 0.42,
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
  }, [sessionId, faceDetected, faceCount, gazeDirection, tabHidden]);

  // Status color logic
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
              display: 'inline-block'
            }} />
            <span style={{ fontWeight: 700, color: isOk ? '#6EE7B7' : '#FDA4AF' }}>
              {isOk ? 'AI Proctor: Monitored' : 'Anomaly Detected'}
            </span>
          </div>
          <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            10s Heartbeat
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

          {/* Real-Time Detection Bounding Overlay */}
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
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          }}>
            <span style={{ color: faceDetected ? '#6EE7B7' : '#FDA4AF' }}>
              Face: {faceCount} detected
            </span>
            <span style={{ color: gazeDirection === 'CENTER' ? '#6EE7B7' : '#FCD34D' }}>
              Gaze: {gazeDirection}
            </span>
          </div>
        </div>

        {/* Hidden Canvas for Snapshots */}
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
              setGazeDirection(prev => prev === 'CENTER' ? 'OFF_SCREEN' : 'CENTER');
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
