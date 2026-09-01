import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, ArrowLeft, Download, Award, BarChart3, 
  HelpCircle, Sparkles, BookOpen, Clock, ShieldCheck, Printer
} from 'lucide-react';
import { ExamResultData } from '../types';
import { api } from '../services/api';

interface StudentResultsViewProps {
  sessionId?: string;
  onBackToExams: () => void;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({ sessionId, onBackToExams }) => {
  const [result, setResult] = useState<ExamResultData>({
    session_id: sessionId || 'sess-alex-01',
    exam_title: 'Advanced Computer Systems & AI Examination (2026)',
    subject: 'Computer Science',
    total_score: 23.8,
    max_possible_score: 25.0,
    objective_score: 5.0,
    subjective_score: 18.8,
    percentile: 96.4,
    integrity_status: 'CLEARED',
    is_published: true,
    evaluated_at: new Date().toISOString(),
    cohort_stats: {
      mean: 17.5,
      median: 18.0,
      standard_deviation: 3.8,
      distribution: [
        { bracket: '0-20%', count: 1 },
        { bracket: '21-40%', count: 2 },
        { bracket: '41-60%', count: 5 },
        { bracket: '61-80%', count: 12 },
        { bracket: '81-100%', count: 6 }
      ]
    },
    question_breakdown: [
      {
        question_id: 'q1',
        order_index: 0,
        question_type: 'MCQ',
        question_content: 'Which CPU scheduling algorithm gives the minimum average waiting time for a given set of processes?',
        max_marks: 2.0,
        score_awarded: 2.0,
        model_answer: 'Shortest Job First (SJF / SRTF)',
        student_response: 'Shortest Job First (SJF / SRTF)',
        examiner_feedback: 'Correct option selected. Auto-graded with full credit.'
      },
      {
        question_id: 'q2',
        order_index: 1,
        question_type: 'multi_select',
        question_content: 'Which of the following protocols operate at the Transport Layer of the OSI model? (Select all that apply)',
        max_marks: 3.0,
        score_awarded: 3.0,
        model_answer: 'TCP, UDP',
        student_response: 'TCP, UDP',
        examiner_feedback: 'All correct transport layer options identified.'
      },
      {
        question_id: 'q3',
        order_index: 2,
        question_type: 'short_answer',
        question_content: 'Explain the difference between Paging and Segmentation in modern virtual memory systems.',
        max_marks: 5.0,
        score_awarded: 4.8,
        model_answer: 'Paging divides memory into fixed-size frames eliminating external fragmentation. Segmentation divides memory into variable-sized logical blocks (code/stack/heap).',
        student_response: 'Paging divides memory into fixed-size physical blocks called frames and logical pages. This completely prevents external fragmentation. In contrast, segmentation splits memory into variable-sized logical segments like code, stack, and heap.',
        examiner_feedback: 'Excellent explanation of fragmentation tradeoffs.'
      },
      {
        question_id: 'q4',
        order_index: 3,
        question_type: 'long_answer',
        question_content: 'Analyze the CAP Theorem in distributed databases. Discuss how modern partitioned systems balance consistency models using Quorum Consensus (R + W > N).',
        max_marks: 10.0,
        score_awarded: 9.5,
        model_answer: 'CAP theorem proves C, A, P impossibility under partition. Modern systems use tunable quorum consensus (R + W > N).',
        student_response: 'The CAP Theorem proves that a distributed system cannot simultaneously achieve Consistency, Availability, and Partition Tolerance under network splits. Modern databases utilize Quorum Consensus governed by R + W > N, guaranteeing read/write overlap.',
        examiner_feedback: 'Flawless mathematical formulation and linearizability explanation.'
      },
      {
        question_id: 'q5',
        order_index: 4,
        question_type: 'image_upload',
        question_content: 'Draw and upload a handwritten or sketched diagram illustrating the step-by-step insertion of keys [10, 20, 5, 6, 12, 30] into a B-Tree of order 3.',
        max_marks: 5.0,
        score_awarded: 4.5,
        model_answer: 'B-tree of order 3 with median root splits.',
        student_response: '[Handwritten Diagram Snapshot]',
        examiner_feedback: 'Clean diagram with accurate root split points.'
      }
    ]
  });

  useEffect(() => {
    if (sessionId) {
      api.getStudentResult(sessionId)
        .then((data) => {
          if (data) setResult(data);
        })
        .catch((e) => console.warn('Result fetch fallback', e));
    }
  }, [sessionId]);

  const percentage = ((result.total_score / result.max_possible_score) * 100).toFixed(1);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={onBackToExams}>
          <ArrowLeft size={16} />
          Back to Examination Portal
        </button>

        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={16} />
          Print Official Grade Report
        </button>
      </div>

      {/* Official Score Summary Card */}
      <div className="glass-panel" style={{
        padding: '2.5rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '2rem',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <ShieldCheck size={20} color="#10B981" />
            <span className="badge badge-emerald">Verified Examination Result</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{result.exam_title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Discipline: <strong>{result.subject}</strong> | Evaluated by Faculty Board
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Score</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#F8FAFC' }}>
                {result.total_score} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ {result.max_possible_score}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Percentage</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10B981' }}>
                {percentage}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cohort Percentile</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#818CF8' }}>
                {result.percentile}th
              </div>
            </div>
          </div>
        </div>

        {/* Cohort Bell Curve Chart */}
        <div style={{
          background: 'var(--bg-surface)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={16} color="#818CF8" />
            Cohort Percentile Distribution
          </h4>

          <div style={{ display: 'flex', alignItems: 'flex-end', height: '110px', gap: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
            {result.cohort_stats?.distribution?.map((d, idx) => {
              const isUserBracket = idx === 4; // Top bracket
              const height = (d.count / 14) * 100;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '100%',
                    height: `${height}%`,
                    background: isUserBracket ? 'linear-gradient(180deg, #6366F1, #8B5CF6)' : 'rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    border: isUserBracket ? '1px solid #A5B4FC' : 'none',
                    boxShadow: isUserBracket ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none'
                  }} />
                  <span style={{ fontSize: '0.7rem', color: isUserBracket ? '#A5B4FC' : 'var(--text-muted)', fontWeight: isUserBracket ? 700 : 400 }}>
                    {d.bracket}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            <span>Cohort Mean: <strong>{result.cohort_stats?.mean} pts</strong></span>
            <span style={{ color: '#6EE7B7' }}>Your Rank: <strong>Top 4%</strong></span>
          </div>
        </div>
      </div>

      {/* Question Breakdown Section */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} color="#818CF8" />
          Question Performance Breakdown
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {result.question_breakdown.map((q, idx) => (
            <div
              key={q.question_id || idx}
              style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {/* Question Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-indigo">Q{idx + 1}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {q.question_type.replace('_', ' ')}
                  </span>
                </div>
                <span className="badge badge-emerald">
                  Score: {q.score_awarded} / {q.max_marks} Marks
                </span>
              </div>

              {/* Prompt */}
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {q.question_content}
              </div>

              {/* Student Response */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '0.875rem', borderRadius: '8px' }}>
                <strong style={{ color: '#F8FAFC' }}>Your Submission: </strong>
                {q.student_response}
              </div>

              {/* Feedback */}
              {q.examiner_feedback && (
                <div style={{ fontSize: '0.85rem', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} />
                  <span><strong>Examiner Feedback:</strong> {q.examiner_feedback}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
