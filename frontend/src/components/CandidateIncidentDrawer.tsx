import React, { useState } from 'react';
import { 
  X, AlertTriangle, ShieldAlert, Eye, MessageSquare, 
  PauseCircle, Slash, RefreshCw, CheckCircle2, Clock, Monitor
} from 'lucide-react';
import { ProctorAlert } from '../types';

interface CandidateIncidentDrawerProps {
  candidate: {
    id: string;
    student_name: string;
    exam_title: string;
    suspicion_score: number;
    tab_switches: number;
    face_status: 'single' | 'multiple' | 'absent';
    gaze_status: 'center' | 'left' | 'right' | 'down';
    status: 'active' | 'flagged' | 'submitted';
  } | null;
  alerts: ProctorAlert[];
  onClose: () => void;
  onSendWarning: (candidateId: string, message: string) => void;
  onPauseExam: (candidateId: string) => void;
  onDisqualify: (candidateId: string) => void;
}

export const CandidateIncidentDrawer: React.FC<CandidateIncidentDrawerProps> = ({
  candidate,
  alerts,
  onClose,
  onSendWarning,
  onPauseExam,
  onDisqualify,
}) => {
  const [warningText, setWarningText] = useState<string>('Please look directly at your screen. Off-screen gaze detected.');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!candidate) return null;

  const candidateAlerts = alerts.filter(
    (a) => a.student_name.toLowerCase().includes(candidate.student_name.toLowerCase().split(' ')[0])
  );

  const handleAction = (type: 'warning' | 'pause' | 'disqualify') => {
    if (type === 'warning') {
      onSendWarning(candidate.id, warningText);
      setActionFeedback(`Warning dispatched to ${candidate.student_name}`);
    } else if (type === 'pause') {
      onPauseExam(candidate.id);
      setActionFeedback(`Exam paused remotely for ${candidate.student_name}`);
    } else if (type === 'disqualify') {
      onDisqualify(candidate.id);
      setActionFeedback(`Session disqualified & locked for ${candidate.student_name}`);
    }
    setTimeout(() => setActionFeedback(null), 3000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '460px',
      background: 'rgba(15, 23, 42, 0.98)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid var(--border-subtle)',
      zIndex: 9000,
      boxShadow: '-10px 0 30px rgba(0,0,0,0.7)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.75rem'
    }}>
      {/* Drawer Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className={`badge ${candidate.suspicion_score > 60 ? 'badge-coral' : (candidate.suspicion_score > 30 ? 'badge-amber' : 'badge-emerald')}`}>
              Suspicion: {candidate.suspicion_score}%
            </span>
            <span className="badge badge-indigo">{candidate.status.toUpperCase()}</span>
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{candidate.student_name}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{candidate.exam_title}</p>
        </div>

        <button className="btn btn-secondary" style={{ padding: '6px 8px' }} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid #10B981',
          color: '#6EE7B7',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '1rem'
        }}>
          <CheckCircle2 size={16} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Live Telemetry Card */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        padding: '1.25rem',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        fontSize: '0.85rem'
      }}>
        <div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Face Optical Sensor</div>
          <div style={{ fontWeight: 700, color: candidate.face_status === 'single' ? '#6EE7B7' : '#FCA5A5' }}>
            {candidate.face_status === 'single' ? '1 Face (Verified)' : (candidate.face_status === 'multiple' ? 'Multiple Persons' : 'Face Absent')}
          </div>
        </div>

        <div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Gaze Orientation</div>
          <div style={{ fontWeight: 700, color: candidate.gaze_status === 'center' ? '#6EE7B7' : '#FBBF24' }}>
            {candidate.gaze_status.toUpperCase()}
          </div>
        </div>

        <div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Tab Blur Events</div>
          <div style={{ fontWeight: 700, color: candidate.tab_switches > 0 ? '#FCA5A5' : '#6EE7B7' }}>
            {candidate.tab_switches} switches logged
          </div>
        </div>

        <div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Heartbeat Link</div>
          <div style={{ fontWeight: 700, color: '#38BDF8' }}>10s WebSocket Active</div>
        </div>
      </div>

      {/* Timestamped Violation Feed */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} color="#A5B4FC" />
          Incident Log Timeline ({candidateAlerts.length})
        </h4>

        {candidateAlerts.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No security violations recorded for this candidate.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {candidateAlerts.map((alt, idx) => (
              <div key={alt.id || idx} style={{
                padding: '0.875rem',
                borderRadius: '8px',
                background: alt.severity === 'high' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${alt.severity === 'high' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.25)'}`,
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: alt.severity === 'high' ? '#F87171' : '#FBBF24' }}>
                    {alt.event_type.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alt.timestamp}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{alt.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proctor Remote Action Controls */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Remote Proctor Interventions</h4>

        {/* Warning Custom text */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            value={warningText}
            onChange={(e) => setWarningText(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem'
            }}
          />
          <button
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            onClick={() => handleAction('warning')}
          >
            <MessageSquare size={14} />
            Warn
          </button>
        </div>

        {/* Remote Lockdown actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', color: '#FBBF24', borderColor: 'rgba(245, 158, 11, 0.3)' }}
            onClick={() => handleAction('pause')}
          >
            <PauseCircle size={14} />
            Pause Exam
          </button>

          <button
            className="btn btn-danger"
            style={{ fontSize: '0.8rem' }}
            onClick={() => handleAction('disqualify')}
          >
            <Slash size={14} />
            Disqualify Session
          </button>
        </div>
      </div>
    </div>
  );
};
