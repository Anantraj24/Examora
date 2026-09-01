import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Clock, ShieldCheck, Play, 
  Sparkles, CheckCircle, AlertCircle, ArrowRight, Eye
} from 'lucide-react';
import { api } from '../services/api';
import { Exam } from '../types';

interface ExamListViewProps {
  onStartExam: (examId: string) => void;
  onViewResults: (sessionId: string) => void;
}

export const ExamListView: React.FC<ExamListViewProps> = ({ onStartExam, onViewResults }) => {
  const [exams, setExams] = useState<Exam[]>([
    {
      id: 'exam-01',
      title: 'Advanced Computer Systems & AI Examination (2026)',
      subject: 'Computer Science',
      instructions: 'Strict AI proctoring active. Multiple face detection, continuous gaze tracking, and window blur logging are enforced.',
      duration_minutes: 45,
      is_published: true,
      total_questions: 5,
      total_marks: 25.0,
      proctoring_config: {
        webcam_required: true,
        gaze_tracking: true,
        multi_face_detection: true,
        max_tab_switches: 3
      }
    },
    {
      id: 'exam-02',
      title: 'Distributed Systems & Cloud Architecture Final',
      subject: 'Computer Science',
      instructions: 'Covers CAP Theorem, Quorum Consensus, Raft, and Vector Clocks.',
      duration_minutes: 60,
      is_published: true,
      total_questions: 8,
      total_marks: 40.0,
      proctoring_config: {
        webcam_required: true,
        gaze_tracking: true,
        multi_face_detection: true,
        max_tab_switches: 3
      }
    }
  ]);

  useEffect(() => {
    async function loadExams() {
      try {
        const data = await api.getExams();
        if (data && data.length > 0) {
          setExams(data);
        }
      } catch (e) {
        console.warn('Exams fetch fallback', e);
      }
    }
    loadExams();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '2rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <ShieldCheck size={20} color="#6EE7B7" />
            <span className="badge badge-emerald">Secure Examination Environment</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Available Proctored Examinations</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px', maxWidth: '600px' }}>
            Select an active examination below. AI proctoring will verify your webcam feed, gaze orientation, and browser focus throughout your session.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontSize: '1rem' }}
          onClick={() => onStartExam(exams[0]?.id || 'exam-01')}
        >
          <Play size={18} fill="#FFF" />
          Launch Recommended Exam
        </button>
      </div>

      {/* Exam Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {exams.map((ex, idx) => (
          <div key={ex.id || idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-indigo">{ex.subject}</span>
                <span className="badge badge-emerald">Active Window</span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '0.75rem' }}>
                {ex.title}
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {ex.instructions || 'Standard university examination rules apply.'}
              </p>

              {/* Meta stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                padding: '0.875rem',
                background: 'var(--bg-surface)',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <Clock size={14} color="#A5B4FC" />
                  <span>Duration: <strong style={{ color: '#F8FAFC' }}>{ex.duration_minutes} mins</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={14} color="#6EE7B7" />
                  <span>AI Proctoring: <strong style={{ color: '#6EE7B7' }}>Active</strong></span>
                </div>
              </div>
            </div>

            {/* Launch Action Button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => onStartExam(ex.id)}
            >
              Start Proctored Exam
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
