import React, { useState, useEffect } from 'react';
import { 
  Radio, ShieldAlert, AlertTriangle, Eye, Users, 
  ExternalLink, CheckCircle, RefreshCw, BarChart2, UserX, Clock
} from 'lucide-react';
import { api } from '../services/api';
import { ProctorAlert } from '../types';

export const ProctorMissionControl: React.FC = () => {
  const [liveSessions, setLiveSessions] = useState<any[]>([
    {
      session_id: 'sess-001',
      student_name: 'Alex Mercer',
      student_email: 'alex@exam.io',
      exam_title: 'Advanced Computer Systems & AI Examination (2026)',
      status: 'IN_PROGRESS',
      suspicion_score: 12.0,
      tab_switches: 0,
      time_left: '38:15',
      anomaly: 'Normal'
    },
    {
      session_id: 'sess-002',
      student_name: 'Priya Sharma',
      student_email: 'priya@exam.io',
      exam_title: 'Advanced Computer Systems & AI Examination (2026)',
      status: 'IN_PROGRESS',
      suspicion_score: 74.0,
      tab_switches: 3,
      time_left: '24:50',
      anomaly: 'Gaze Away & Tab Switch'
    },
    {
      session_id: 'sess-003',
      student_name: 'Rohan Mehta',
      student_email: 'rohan@exam.io',
      exam_title: 'Advanced Computer Systems & AI Examination (2026)',
      status: 'FLAGGED',
      suspicion_score: 88.0,
      tab_switches: 4,
      time_left: '12:04',
      anomaly: 'Multiple Faces Detected'
    },
    {
      session_id: 'sess-004',
      student_name: 'Divya Taneja',
      student_email: 'divya@exam.io',
      exam_title: 'Advanced Computer Systems & AI Examination (2026)',
      status: 'IN_PROGRESS',
      suspicion_score: 18.0,
      tab_switches: 0,
      time_left: '31:20',
      anomaly: 'Normal'
    }
  ]);

  const [alerts, setAlerts] = useState<ProctorAlert[]>([
    {
      type: 'PROCTOR_ALERT',
      session_id: 'sess-003',
      student_name: 'Rohan Mehta',
      exam_title: 'Advanced Computer Systems & AI Examination',
      suspicion_score: 88.0,
      events: [{ event_type: 'MULTI_FACE', suspicion_delta: 25.0, message: 'Multiple persons detected in webcam frame (2 faces)' }],
      timestamp: '2 mins ago'
    },
    {
      type: 'PROCTOR_ALERT',
      session_id: 'sess-002',
      student_name: 'Priya Sharma',
      exam_title: 'Advanced Computer Systems & AI Examination',
      suspicion_score: 74.0,
      events: [{ event_type: 'GAZE_AWAY', suspicion_delta: 12.0, message: 'Continuous off-screen gaze deviation (RIGHT)' }],
      timestamp: '5 mins ago'
    },
    {
      type: 'PROCTOR_ALERT',
      session_id: 'sess-002',
      student_name: 'Priya Sharma',
      exam_title: 'Advanced Computer Systems & AI Examination',
      suspicion_score: 62.0,
      events: [{ event_type: 'TAB_BLUR', suspicion_delta: 15.0, message: 'Browser window blur / tab switch event' }],
      timestamp: '9 mins ago'
    }
  ]);

  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  useEffect(() => {
    // Poll live overview from backend if running
    async function fetchOverview() {
      try {
        const data = await api.getLiveProctorOverview();
        if (data && data.sessions && data.sessions.length > 0) {
          setLiveSessions(data.sessions);
        }
      } catch (e) {
        // Keeps state populated
      }
    }
    fetchOverview();
    const interval = setInterval(fetchOverview, 6000);
    return () => clearInterval(interval);
  }, []);

  const totalActive = liveSessions.filter(s => s.status === 'IN_PROGRESS' || s.status === 'FLAGGED').length;
  const totalFlagged = liveSessions.filter(s => s.suspicion_score >= 60.0).length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Top Banner & KPI Stat Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={22} color="#EF4444" className="animate-pulse-slow" />
              Proctoring Mission Control & Live Telemetry Hub
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Real-time anomaly ingestion, edge computer vision telemetry, and active integrity scoring.
            </p>
          </div>
          <span className="badge badge-emerald">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
            Live Ingestion WSS Active
          </span>
        </div>

        {/* 5 Top Summary Metric Cards (Matching PDF Page 6) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Sessions</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{totalActive}</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '2px' }}>+4 entered in last 10m</div>
          </div>

          <div className="glass-panel" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Exams Scheduled Today</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>12</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>8 completed</div>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', borderColor: totalFlagged > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: '#F87171', fontWeight: 600, textTransform: 'uppercase' }}>Flagged Sessions</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>{totalFlagged}</div>
            <div style={{ fontSize: '0.7rem', color: '#FCA5A5', marginTop: '2px' }}>Suspicion &gt; 60%</div>
          </div>

          <div className="glass-panel" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>AI Grading Queue</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#A5B4FC', marginTop: '4px' }}>138</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>94 AI pre-scored</div>
          </div>

          <div className="glass-panel" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Cohort Score</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6EE7B7', marginTop: '4px' }}>71.4%</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Across active exams</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Candidate Monitoring Grid (Left) + Real-time Alert Ticker & Breakdown (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Live Candidate Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Exam Sessions Stream</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Updated every 6s</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {liveSessions.map((s, idx) => {
              const isHigh = s.suspicion_score >= 60;
              const isMed = s.suspicion_score >= 30 && s.suspicion_score < 60;
              return (
                <div
                  key={s.session_id || idx}
                  onClick={() => setSelectedSession(s)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '10px',
                    background: 'var(--bg-surface)',
                    border: `1px solid ${isHigh ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: isHigh ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                      color: isHigh ? '#F87171' : '#A5B4FC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {s.student_name ? s.student_name.split(' ').map((n: string) => n[0]).join('') : 'ST'}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {s.student_email} • Tab switches: <strong style={{ color: s.tab_switches > 0 ? '#F59E0B' : '#64748B' }}>{s.tab_switches}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Suspicion Bar */}
                    <div style={{ width: '120px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '3px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Suspicion</span>
                        <span style={{ fontWeight: 700, color: isHigh ? '#EF4444' : (isMed ? '#F59E0B' : '#10B981') }}>
                          {Math.round(s.suspicion_score)}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, s.suspicion_score)}%`,
                          height: '100%',
                          background: isHigh ? '#EF4444' : (isMed ? '#F59E0B' : '#10B981'),
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    <span className={`badge ${isHigh ? 'badge-rose' : (isMed ? 'badge-amber' : 'badge-emerald')}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Real-Time Incident Feed & Cohort Signal Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Real-time Alerts Feed */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <ShieldAlert size={18} color="#EF4444" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Proctoring Alerts Ticker</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto' }}>
              {alerts.map((al, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.875rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#FCA5A5' }}>
                      {al.student_name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{al.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {al.events[0]?.message}
                  </div>
                  <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 700 }}>
                      Suspicion Score: {al.suspicion_score}%
                    </span>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                      onClick={() => alert(`Reviewing violation incident for ${al.student_name}`)}
                    >
                      Inspect Snapshot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry Health Stats (From PDF) */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Cohort Integrity Signal Rates
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Face presence verified</span>
                <strong style={{ color: '#6EE7B7' }}>91.4%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Continuous gaze on-screen</span>
                <strong style={{ color: '#6EE7B7' }}>78.2%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Zero tab-switch compliance</span>
                <strong style={{ color: '#FCD34D' }}>83.0%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Single face in frame</span>
                <strong style={{ color: '#6EE7B7' }}>98.6%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
