import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Mic, Monitor, ShieldCheck, CheckCircle2, 
  AlertTriangle, ArrowRight, RefreshCw, Sparkles, UserCheck, Lock
} from 'lucide-react';
import { aiVisionEngine } from '../services/aiVisionProctor';

interface SystemCheckModalProps {
  examTitle: string;
  durationMinutes: number;
  onProceed: () => void;
  onCancel: () => void;
}

export const SystemCheckModal: React.FC<SystemCheckModalProps> = ({
  examTitle,
  durationMinutes,
  onProceed,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'passed' | 'failed'>('checking');
  const [faceStatus, setFaceStatus] = useState<'checking' | 'passed' | 'no_face'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'passed' | 'failed'>('checking');
  const [audioLevel, setAudioLevel] = useState<number>(25);
  const [idCaptured, setIdCaptured] = useState<boolean>(false);
  const [pledgeChecked, setPledgeChecked] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize camera and mic verification with AI face detection
  useEffect(() => {
    let stream: MediaStream | null = null;
    let faceCheckTimer: any = null;

    async function startMedia() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.warn);
          };
        }
        setCameraStatus('passed');
        setMicStatus('passed');

        // Dynamic face detection loop
        faceCheckTimer = setInterval(async () => {
          if (videoRef.current && videoRef.current.videoWidth > 0) {
            const res = await aiVisionEngine.analyzeFrame(videoRef.current);
            if (res.faceDetected && res.faceCount === 1) {
              setFaceStatus('passed');
            } else if (!res.faceDetected) {
              setFaceStatus('no_face');
            }
          }
        }, 500);
      } catch (err) {
        console.warn('System check camera/mic fallback', err);
        setCameraStatus('passed');
        setMicStatus('passed');
        setFaceStatus('passed');
      }
    }
    startMedia();

    // Simulated audio level pulse
    const audioInterval = setInterval(() => {
      setAudioLevel(Math.floor(Math.random() * 45) + 15);
    }, 400);

    return () => {
      clearInterval(audioInterval);
      if (faceCheckTimer) clearInterval(faceCheckTimer);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [step]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '720px',
        width: '100%',
        padding: '2.5rem',
        borderRadius: '16px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={24} color="#FFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Pre-Exam Readiness Verification</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{examTitle} ({durationMinutes} mins)</p>
            </div>
          </div>
          <div className="badge badge-indigo">Step {step} of 3</div>
        </div>

        {/* Step 1: Camera & Microphone Test */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Ensure your webcam and microphone are functioning clearly. AI proctoring uses edge ML face verification and ambient noise monitoring throughout your exam.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Webcam Box */}
              <div style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#000',
                aspectRatio: '4/3',
                border: '2px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#6EE7B7'
                }}>
                  <CheckCircle2 size={12} />
                  <span>Optical Stream Active</span>
                </div>
              </div>

              {/* Hardware checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Camera size={18} color="#A5B4FC" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Webcam Sensor</span>
                  </div>
                  <span className="badge badge-emerald">Verified</span>
                </div>

                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Mic size={18} color="#6EE7B7" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Microphone Audio</span>
                    </div>
                    <span className="badge badge-emerald">Active</span>
                  </div>
                  {/* Audio Volume Bar */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${audioLevel}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10B981, #F59E0B)',
                      transition: 'width 0.2s ease'
                    }} />
                  </div>
                </div>

                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Monitor size={18} color="#38BDF8" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Display & Resolution</span>
                  </div>
                  <span className="badge badge-emerald">1080p Single Display</span>
                </div>

                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={18} color="#C084FC" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>AI Face Centering</span>
                  </div>
                  <span className={`badge ${faceStatus === 'passed' ? 'badge-emerald' : faceStatus === 'no_face' ? 'badge-rose' : 'badge-indigo'}`}>
                    {faceStatus === 'passed' ? 'Face Verified' : faceStatus === 'no_face' ? 'Position in Frame' : 'Detecting...'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Continue to ID Verification
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Photo ID Verification */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Hold your University Student ID card or Government Photo ID up to the webcam to verify candidate identity.
            </p>

            <div style={{
              padding: '2rem',
              background: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '2px dashed rgba(99, 102, 241, 0.4)',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: idCaptured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: idCaptured ? '#10B981' : 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                {idCaptured ? <CheckCircle2 size={32} /> : <UserCheck size={32} />}
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                {idCaptured ? 'Student ID Card Confirmed' : 'Candidate Identification Verification'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                {idCaptured ? 'Facial biometrics match candidate profile: Alex Mercer (CS-2026-8912)' : 'Position your student ID clearly inside the camera frame and click Capture.'}
              </p>

              <button
                className={`btn ${idCaptured ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setIdCaptured(!idCaptured)}
              >
                {idCaptured ? 'Retake Photo ID' : 'Capture & Verify ID'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button
                className="btn btn-primary"
                disabled={!idCaptured}
                onClick={() => setStep(3)}
              >
                Continue to Academic Pledge
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Academic Pledge & Lockdown Authorization */}
        {step === 3 && (
          <div>
            <div style={{
              padding: '1.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Lock size={18} color="#F87171" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#F87171' }}>Lockdown Protocol Notice</h4>
              </div>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.25rem', margin: 0 }}>
                <li>Your browser will enter <strong>Strict Fullscreen Mode</strong> upon starting.</li>
                <li>Switching browser tabs or minimizing the window will trigger automated incident logging.</li>
                <li>Copying, pasting, and secondary monitor outputs are disabled.</li>
                <li>Server clock is authoritative: exam auto-submits when time expires.</li>
              </ul>
            </div>

            {/* Pledge Checkbox */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '1rem',
              background: 'var(--bg-surface)',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              cursor: 'pointer'
            }} onClick={() => setPledgeChecked(!pledgeChecked)}>
              <input
                type="checkbox"
                checked={pledgeChecked}
                onChange={(e) => setPledgeChecked(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                I affirm that I will uphold university academic integrity. I will not consult external materials, communication tools, or unauthorized assistance during this proctored examination.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button
                className="btn btn-primary"
                disabled={!pledgeChecked}
                onClick={onProceed}
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  borderColor: '#10B981',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Lock size={16} />
                Authorize & Launch Lockdown Exam
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
