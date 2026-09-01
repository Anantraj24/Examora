import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, Eye, Users, 
  Activity, ArrowUpRight, Search, Sliders, Play, Pause,
  Radio, CheckCircle2, UserX, Clock
} from 'lucide-react';
import { ProctorAlert } from '../types';
import { CandidateIncidentDrawer } from './CandidateIncidentDrawer';
import { api } from '../services/api';

interface CandidateFeed {
  id: string;
  student_name: string;
  exam_title: string;
  suspicion_score: number;
  tab_switches: number;
  face_status: 'single' | 'multiple' | 'absent';
  gaze_status: 'center' | 'left' | 'right' | 'down';
  status: 'active' | 'flagged' | 'submitted';
  avatar_color: string;
}

export const ProctorMissionControl: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateFeed[]>([
    {
      id: 'c-01',
      student_name: 'Alex Mercer',
      exam_title: 'Adv Computer Systems & AI',
      suspicion_score: 8,
      tab_switches: 0,
      face_status: 'single',
      gaze_status: 'center',
      status: 'submitted',
      avatar_color: '#6366F1'
    },
    {
      id: 'c-02',
      student_name: 'Priya Sharma',
      exam_title: 'Adv Computer Systems & AI',
      suspicion_score: 76,
      tab_switches: 3,
      face_status: 'single',
      gaze_status: 'right',
      status: 'active',
      avatar_color: '#EC4899'
    },
    {
      id: 'c-03',
      student_name: 'Rohan Mehta',
      exam_title: 'Adv Computer Systems & AI',
      suspicion_score: 88,
      tab_switches: 4,
      face_status: 'multiple',
      gaze_status: 'down',
      status: 'flagged',
      avatar_color: '#F59E0B'
    },
    {
      id: 'c-04',
      student_name: 'Ananya Joshi',
      exam_title: 'Deep Learning & Neural Nets',
      suspicion_score: 14,
      tab_switches: 0,
      face_status: 'single',
      gaze_status: 'center',
      status: 'active',
      avatar_color: '#10B981'
    },
    {
      id: 'c-05',
      student_name: 'Sahil Kapoor',
      exam_title: 'Adv Computer Systems & AI',
      suspicion_score: 52,
      tab_switches: 2,
      face_status: 'single',
      gaze_status: 'left',
      status: 'submitted',
      avatar_color: '#8B5CF6'
    },
    {
      id: 'c-06',
      student_name: 'Divya Taneja',
      exam_title: 'Deep Learning & Neural Nets',
      suspicion_score: 22,
      tab_switches: 1,
      face_status: 'single',
      gaze_status: 'center',
      status: 'active',
      avatar_color: '#06B6D4'
    },
    {
      id: 'c-07',
      student_name: 'Vikram Singh',
      exam_title: 'Distributed Systems & Cloud',
      suspicion_score: 18,
      tab_switches: 0,
      face_status: 'single',
      gaze_status: 'center',
      status: 'active',
      avatar_color: '#F97316'
    },
    {
      id: 'c-08',
      student_name: 'Neha Reddy',
      exam_title: 'Distributed Systems & Cloud',
      suspicion_score: 65,
      tab_switches: 2,
      face_status: 'absent',
      gaze_status: 'center',
      status: 'active',
      avatar_color: '#14B8A6'
    },
    {
      id: 'c-09',
      student_name: 'Chen Wei',
      exam_title: 'Adv Computer Systems & AI',
      suspicion_score: 11,
      tab_switches: 0,
      face_status: 'single',
      gaze_status: 'center',
      status: 'active',
      avatar_color: '#3B82F6'
    }
  ]);

  const [alerts, setAlerts] = useState<ProctorAlert[]>([
    {
      id: 'alt-01',
      session_id: 'sess-02',
      student_name: 'Priya Sharma',
      event_type: 'TAB_BLUR',
      severity: 'high',
      message: 'Browser focus lost: Window minimized or tab switched (3rd occurrence).',
      timestamp: '10:42:15 AM'
    },
    {
      id: 'alt-02',
      session_id: 'sess-03',
      student_name: 'Rohan Mehta',
      event_type: 'MULTI_FACE',
      severity: 'high',
      message: 'Multiple persons detected in webcam frame (2 faces visible).',
      timestamp: '10:41:02 AM'
    },
    {
      id: 'alt-03',
      session_id: 'sess-08',
      student_name: 'Neha Reddy',
      event_type: 'FACE_ABSENT',
      severity: 'medium',
      message: 'Candidate face absent from camera frame for >15s.',
      timestamp: '10:39:48 AM'
    },
    {
      id: 'alt-04',
      session_id: 'sess-02',
      student_name: 'Priya Sharma',
      event_type: 'GAZE_AWAY',
      severity: 'medium',
      message: 'Continuous off-screen gaze deviation (RIGHT).',
      timestamp: '10:38:12 AM'
    }
  ]);

  const [selectedCandidate, setSelectedCandidate] = useState<CandidateFeed | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'active'>('all');

  // Load real proctor telemetry from backend if available
  useEffect(() => {
    async function fetchOverview() {
      try {
        const data = await api.getLiveProctorOverview();
        if (data && data.recent_alerts && data.recent_alerts.length > 0) {
          setAlerts(data.recent_alerts);
        }
      } catch (e) {
        // Cached overview fallback
      }
    }
    fetchOverview();
    const interval = setInterval(fetchOverview, 6000);
    return () => clearInterval(interval);
  }, []);

  const filteredCandidates = candidates.filter((c) => {
    const matchesQuery = c.student_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
                         c.exam_title.toLowerCase().includes(filterQuery.toLowerCase());
    if (statusFilter === 'flagged') return matchesQuery && c.suspicion_score >= 60;
    if (statusFilter === 'active') return matchesQuery && c.status === 'active';
    return matchesQuery;
  });

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* Top Mission Control Header & Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
        
        {/* Metric 1: Active In-Session */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Candidates</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{candidates.filter(c => c.status === 'active').length} / {candidates.length}</div>
          </div>
        </div>

        {/* Metric 2: Flagged High Suspicion */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>High Suspicion Flagged</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F87171' }}>
              {candidates.filter(c => c.suspicion_score >= 60).length} Candidates
            </div>
          </div>
        </div>

        {/* Metric 3: Integrity Pass Rate */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cohort Integrity Index</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34D399' }}>91.4%</div>
          </div>
        </div>

        {/* Metric 4: WebSocket Telemetry Rate */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#22D3EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Heartbeat Ingestion</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>10s Streamed</div>
          </div>
        </div>
      </div>

      {/* Main Mission Control Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.75rem' }}>
        
        {/* Left Column: 3x3 Live Video Stream Grid */}
        <div>
          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => setStatusFilter('all')}
              >
                All Streams ({candidates.length})
              </button>
              <button
                className={`btn ${statusFilter === 'flagged' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => setStatusFilter('flagged')}
              >
                Suspicious ({candidates.filter(c => c.suspicion_score >= 60).length})
              </button>
              <button
                className={`btn ${statusFilter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => setStatusFilter('active')}
              >
                Live Active ({candidates.filter(c => c.status === 'active').length})
              </button>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search candidate name..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          {/* 3x3 Candidate Stream Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            {filteredCandidates.map((c) => {
              const isHighRisk = c.suspicion_score >= 60;
              const isMediumRisk = c.suspicion_score >= 30 && c.suspicion_score < 60;

              return (
                <div
                  key={c.id}
                  className="glass-panel"
                  onClick={() => setSelectedCandidate(c)}
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    border: isHighRisk 
                      ? '2px solid rgba(239, 68, 68, 0.7)' 
                      : (isMediumRisk ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-subtle)'),
                    boxShadow: isHighRisk ? '0 0 16px rgba(239, 68, 68, 0.25)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Candidate Simulated Video Frame */}
                  <div style={{
                    position: 'relative',
                    aspectRatio: '16/10',
                    background: '#0B0F19',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {/* Simulated Face mesh box */}
                    <div style={{
                      width: '60px',
                      height: '75px',
                      borderRadius: '50%',
                      border: `2px ${c.face_status === 'single' ? 'solid #10B981' : (c.face_status === 'multiple' ? 'solid #EF4444' : 'dashed #F59E0B')}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: c.avatar_color,
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      background: 'rgba(255,255,255,0.02)',
                      boxShadow: c.face_status === 'single' ? '0 0 10px rgba(16, 185, 129, 0.3)' : '0 0 12px rgba(239, 68, 68, 0.4)'
                    }}>
                      {c.student_name.split(' ').map(n => n[0]).join('')}
                    </div>

                    {/* Live Stream Badges */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: c.status === 'active' ? '#10B981' : '#A5B4FC'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.status === 'active' ? '#10B981' : '#A5B4FC' }} />
                      <span>{c.status === 'active' ? 'REC LIVE' : 'SUBMITTED'}</span>
                    </div>

                    {/* Gaze vector indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      color: c.gaze_status === 'center' ? '#6EE7B7' : '#FBBF24'
                    }}>
                      Gaze: {c.gaze_status.toUpperCase()}
                    </div>

                    {/* Anomaly Callout */}
                    {isHighRisk && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(239, 68, 68, 0.85)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <AlertTriangle size={10} />
                        FLAGGED
                      </div>
                    )}
                  </div>

                  {/* Candidate Information & Suspicion Gauge */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{c.student_name}</h4>
                      <span className={`badge ${isHighRisk ? 'badge-coral' : (isMediumRisk ? 'badge-amber' : 'badge-emerald')}`} style={{ fontSize: '0.75rem' }}>
                        {c.suspicion_score}% Suspicion
                      </span>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {c.exam_title}
                    </p>

                    {/* Suspicion Progress Bar */}
                    <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${c.suspicion_score}%`,
                        height: '100%',
                        background: isHighRisk ? '#EF4444' : (isMediumRisk ? '#F59E0B' : '#10B981'),
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Incident Log Stream */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#EF4444" />
              Live Security Ticker
            </h3>
            <span className="badge badge-coral">{alerts.length} Incidents</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {alerts.map((alt, idx) => (
              <div
                key={alt.id || idx}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: alt.severity === 'high' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${alt.severity === 'high' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.25)'}`,
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#F8FAFC' }}>{alt.student_name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{alt.timestamp}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span className={`badge ${alt.severity === 'high' ? 'badge-coral' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                    {alt.event_type.replace('_', ' ')}
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4, margin: 0 }}>
                  {alt.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Candidate Inspection & Remote Action Drawer */}
      <CandidateIncidentDrawer
        candidate={selectedCandidate}
        alerts={alerts}
        onClose={() => setSelectedCandidate(null)}
        onSendWarning={(cId, msg) => {
          console.log(`Warning sent to ${cId}: ${msg}`);
        }}
        onPauseExam={(cId) => {
          console.log(`Exam paused for ${cId}`);
        }}
        onDisqualify={(cId) => {
          console.log(`Exam disqualified for ${cId}`);
        }}
      />
    </div>
  );
};
