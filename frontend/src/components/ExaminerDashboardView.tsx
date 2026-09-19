import React, { useState, useEffect } from 'react';
import { 
  Bot, Layers, PlusCircle, Shield, BarChart2, Calendar, 
  CheckCircle2, Clock, ArrowRight, Sparkles, FileText, AlertCircle, 
  ExternalLink, UserCheck, ChevronRight, Loader2, RefreshCw
} from 'lucide-react';
import { User, Exam, Question, GradingQueueItem } from '../types';
import { api } from '../services/api';

interface ExaminerDashboardViewProps {
  currentUser: User;
  onNavigateTab: (tab: string) => void;
}

export const ExaminerDashboardView: React.FC<ExaminerDashboardViewProps> = ({
  currentUser,
  onNavigateTab
}) => {
  const [queue, setQueue] = useState<GradingQueueItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [queueRes, examsRes, questionsRes] = await Promise.allSettled([
        api.getGradingQueue(),
        api.getExams(),
        api.getQuestions()
      ]);

      if (queueRes.status === 'fulfilled' && queueRes.value) {
        setQueue(queueRes.value);
      }
      if (examsRes.status === 'fulfilled' && examsRes.value) {
        setExams(examsRes.value);
      }
      if (questionsRes.status === 'fulfilled' && questionsRes.value) {
        setQuestions(questionsRes.value);
      }
    } catch (err) {
      console.warn('Examiner dashboard data fetch fallback', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingGradingCount = queue.filter(q => q.current_examiner_score === undefined || q.current_examiner_score === null).length || queue.length;
  const publishedExamsCount = exams.filter(e => e.is_published).length;

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. WELCOME HERO BANNER */}
      <div 
        className="dash-card" 
        style={{ 
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)', 
          color: '#FFFFFF',
          padding: '2rem',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)'
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.15)', 
              padding: '4px 10px', 
              borderRadius: '9999px', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              letterSpacing: '0.04em',
              textTransform: 'uppercase' 
            }}>
              Examiner & Faculty Studio
            </span>
            <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>● Academic Session 2026</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Welcome back, {currentUser.full_name}
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.5, margin: 0 }}>
            Monitor student submissions, evaluate AI-scored subjective responses with automated rubrics, and configure randomized examination blueprints.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigateTab('grading')}
            className="btn btn-primary"
            style={{ 
              background: '#FFFFFF', 
              color: '#312E81', 
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none'
            }}
          >
            <Bot size={16} color="#312E81" />
            <span>Launch Grading Studio</span>
          </button>
          <button
            onClick={() => onNavigateTab('builder')}
            style={{ 
              background: 'rgba(255, 255, 255, 0.15)', 
              color: '#FFFFFF', 
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              cursor: 'pointer'
            }}
          >
            <PlusCircle size={16} />
            <span>New Exam Blueprint</span>
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        
        {/* Card 1: Pending Evaluations */}
        <div 
          className="dash-card" 
          onClick={() => onNavigateTab('grading')}
          style={{ padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s ease' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Pending Evaluations
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
              <Bot size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'inherit' }}>
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : pendingGradingCount}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', fontWeight: 600 }}>
            <span>Awaiting examiner rubric verification</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 2: Question Bank Inventory */}
        <div 
          className="dash-card" 
          onClick={() => onNavigateTab('questions')}
          style={{ padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s ease' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Question Bank
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'inherit' }}>
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : questions.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#6366F1', marginTop: '4px', fontWeight: 600 }}>
            <span>MCQ, multi-select & subjective pool</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 3: Active Blueprints */}
        <div 
          className="dash-card" 
          onClick={() => onNavigateTab('builder')}
          style={{ padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s ease' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Published Blueprints
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'inherit' }}>
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : `${publishedExamsCount} / ${exams.length}`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>
            <span>Exams published on schedule</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 4: Proctor Integrity */}
        <div 
          className="dash-card" 
          onClick={() => onNavigateTab('proctor')}
          style={{ padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s ease' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Live Proctoring
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4' }}>
              <Shield size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Active</span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#06B6D4', marginTop: '4px', fontWeight: 600 }}>
            <span>Real-time WebSocket telemetry</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN WORKSPACE: RECENT SUBMISSIONS & ACTIVE BLUEPRINTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
        
        {/* Submissions Awaiting Review */}
        <div className="dash-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Subjective Submissions Queue
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Verify AI suggested marks against rubric criteria before publishing final results.
              </p>
            </div>
            <button 
              onClick={() => onNavigateTab('grading')}
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.85rem' }}>Loading evaluation queue...</p>
            </div>
          ) : queue.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', border: '1px dashed #E2E8F0', borderRadius: '12px' }}>
              <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'inherit' }}>All submissions have been evaluated!</p>
              <p style={{ fontSize: '0.78rem' }}>New candidate subjective answers will appear here automatically.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {queue.slice(0, 4).map((item) => (
                <div 
                  key={item.answer_id}
                  style={{
                    padding: '0.9rem 1.1rem',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    background: 'rgba(255, 255, 255, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        color: '#4F46E5',
                        textTransform: 'uppercase'
                      }}>
                        {item.question_type.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                        {item.student_name}
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: '0.82rem', 
                      color: '#64748B', 
                      margin: 0, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {item.question_content}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>AI Suggested</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10B981' }}>
                        {item.ai_evaluation?.suggested_score?.toFixed(1) || 0.0} / {item.max_marks}
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateTab('grading')}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '8px' }}
                    >
                      Grade Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Exam Blueprints */}
        <div className="dash-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Exam Blueprints
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Active examination blueprints and question allocations.
              </p>
            </div>
            <button 
              onClick={() => onNavigateTab('builder')}
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Manage</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {exams.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
              <p style={{ fontSize: '0.85rem' }}>No exam blueprints created yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {exams.slice(0, 4).map((ex) => (
                <div 
                  key={ex.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    background: 'rgba(255, 255, 255, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>
                        {ex.title}
                      </h4>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        background: ex.is_published ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: ex.is_published ? '#10B981' : '#F59E0B'
                      }}>
                        {ex.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                      <span>Subject: <strong>{ex.subject}</strong></span>
                      <span>Duration: <strong>{ex.duration_minutes}m</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('schedule')}
                    className="dash-icon-btn"
                    title="View in Master Schedule"
                  >
                    <Calendar size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick links footer */}
          <div style={{ 
            marginTop: 'auto', 
            padding: '0.85rem 1rem', 
            borderRadius: '10px', 
            background: 'rgba(99, 102, 241, 0.05)', 
            border: '1px solid rgba(99, 102, 241, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4F46E5' }}>
              Want to see cohort performance metrics?
            </span>
            <button
              onClick={() => onNavigateTab('results')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4F46E5',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Cohort Analytics</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
