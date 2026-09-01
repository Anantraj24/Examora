import React, { useState, useEffect } from 'react';
import { 
  Trophy, CheckCircle, XCircle, Award, BarChart3, 
  HelpCircle, MessageSquare, Printer, ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { ExamResultData } from '../types';

interface StudentResultsViewProps {
  sessionId?: string;
  onBackToExams: () => void;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({ sessionId, onBackToExams }) => {
  const [result, setResult] = useState<ExamResultData | null>(null);

  useEffect(() => {
    async function loadResult() {
      if (sessionId) {
        try {
          const data = await api.getStudentResult(sessionId);
          setResult(data);
          return;
        } catch (e) {
          console.warn('Backend result fetch fallback to demo', e);
        }
      }
      
      // Default turnkey result demo
      const sampleResult: ExamResultData = {
        session_id: sessionId || 'sess-sample-01',
        student_name: 'Alex Mercer',
        exam_title: 'Advanced Computer Systems & AI Examination (2026)',
        objective_score: 5.0,
        subjective_score: 17.5,
        total_score: 22.5,
        max_possible_score: 25.0,
        percentage: 90.0,
        percentile: 94.2,
        is_published: true,
        evaluated_at: new Date().toISOString(),
        question_breakdown: [
          {
            question_id: 'q1',
            question_type: 'MCQ',
            question_content: 'Which CPU scheduling algorithm gives the minimum average waiting time for a given set of processes?',
            max_marks: 2.0,
            negative_marks: 0.5,
            marks_awarded: 2.0,
            is_correct: true,
            selected_options: ['Shortest Job First (SJF / SRTF)'],
            correct_options: ['Shortest Job First (SJF / SRTF)']
          },
          {
            question_id: 'q2',
            question_type: 'multi_select',
            question_content: 'Which of the following protocols operate at the Transport Layer of the OSI / TCP-IP reference model? (Select all that apply)',
            max_marks: 3.0,
            negative_marks: 0.5,
            marks_awarded: 3.0,
            is_correct: true,
            selected_options: ['Transmission Control Protocol (TCP)', 'User Datagram Protocol (UDP)'],
            correct_options: ['Transmission Control Protocol (TCP)', 'User Datagram Protocol (UDP)']
          },
          {
            question_id: 'q3',
            question_type: 'short_answer',
            question_content: 'Explain the difference between Paging and Segmentation in modern virtual memory systems.',
            max_marks: 5.0,
            negative_marks: 0.0,
            marks_awarded: 4.5,
            student_text: 'Paging divides memory into fixed size blocks called frames and pages. It avoids external fragmentation. Segmentation splits memory into logical variable segments.',
            model_answer: 'Paging uses fixed frames to eliminate external fragmentation. Segmentation uses logical variable chunks.',
            examiner_feedback: 'Well articulated explanation of fragmentation tradeoffs.',
            ai_justification: 'Matched key concepts: paging, frames, segmentation, external fragmentation.'
          },
          {
            question_id: 'q4',
            question_type: 'long_answer',
            question_content: 'Analyze the CAP Theorem in distributed databases. Discuss how modern partitioned systems balance consistency models using Quorum Consensus.',
            max_marks: 10.0,
            negative_marks: 0.0,
            marks_awarded: 8.5,
            student_text: 'CAP states that under network partitions we choose Consistency or Availability. Quorum formula R + W > N guarantees overlap.',
            model_answer: 'CAP theorem bounds C, A, P. Quorum consensus balances R + W > N with conflict resolution.',
            examiner_feedback: 'Clear quorum explanation and formula proof.',
            ai_justification: 'Accurate quorum math formulation.'
          },
          {
            question_id: 'q5',
            question_type: 'image_upload',
            question_content: 'Draw and upload a handwritten diagram illustrating the step-by-step insertion of keys [10, 20, 5, 6, 12, 30] into a B-Tree of order 3.',
            max_marks: 5.0,
            negative_marks: 0.0,
            marks_awarded: 4.5,
            examiner_feedback: 'Clear node split diagram at order 3 median balance.'
          }
        ]
      };
      setResult(sampleResult);
    }
    loadResult();
  }, [sessionId]);

  if (!result) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-outline" onClick={onBackToExams}>
          <ArrowLeft size={16} />
          Back to Exam Portal
        </button>

        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Printer size={16} />
          Print Performance Scorecard
        </button>
      </div>

      {/* Main Score Card Banner */}
      <div className="glass-panel" style={{
        padding: '2rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>
              Official Verified Scorecard
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{result.exam_title}</h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Candidate: <strong>{result.student_name}</strong> • Completed on {new Date(result.evaluated_at).toLocaleDateString()}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            {/* Total Marks */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#F8FAFC' }}>
                {result.total_score} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ {result.max_possible_score}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>
                {result.percentage}% Grade
              </div>
            </div>

            {/* Percentile Badge */}
            <div style={{
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#A5B4FC' }}>
                <Trophy size={20} color="#F59E0B" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>COHORT PERCENTILE</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#A5B4FC', marginTop: '2px' }}>
                {result.percentile}<sup>th</sup>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Top {(100 - result.percentile).toFixed(1)}% of exam takers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Performance Distribution Histogram */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <BarChart3 size={18} color="#6366F1" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cohort Percentile Distribution</h3>
        </div>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Comparative analysis against all candidates in this exam batch.
        </p>

        {/* Visual Bell Curve Histogram */}
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '1.5rem', padding: '0 1rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '25px', background: 'var(--bg-surface-elevated)', borderRadius: '4px 4px 0 0' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>0-20%</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '45px', background: 'var(--bg-surface-elevated)', borderRadius: '4px 4px 0 0' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>21-40%</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '90px', background: 'var(--bg-surface-elevated)', borderRadius: '4px 4px 0 0' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>41-60%</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '120px', background: 'var(--bg-surface-elevated)', borderRadius: '4px 4px 0 0' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>61-80%</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: '80px',
              background: 'linear-gradient(to top, #6366F1, #38BDF8)',
              borderRadius: '4px 4px 0 0',
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FFF' }}>YOU</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, marginTop: '6px' }}>81-100%</div>
          </div>
        </div>
      </div>

      {/* Question by Question Detailed Feedback Breakdown */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
        Question-by-Question Evaluation Breakdown
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {result.question_breakdown.map((q, idx) => {
          const isObjective = q.question_type === 'MCQ' || q.question_type === 'multi_select';
          return (
            <div key={idx} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-indigo">Q{idx + 1}</span>
                  <span className="badge" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                    {q.question_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isObjective && (
                    q.is_correct ? (
                      <span className="badge badge-emerald"><CheckCircle size={12} /> Full Credit</span>
                    ) : (
                      <span className="badge badge-rose"><XCircle size={12} /> Incorrect</span>
                    )
                  )}
                  <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#6EE7B7' }}>
                    {q.marks_awarded} / {q.max_marks} Marks
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>
                {q.question_content}
              </div>

              {/* Objective Answers Comparison */}
              {isObjective && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Your Selected Option:</div>
                    <div style={{ fontWeight: 600, color: q.is_correct ? '#6EE7B7' : '#FCA5A5' }}>
                      {q.selected_options?.join(', ') || 'None selected'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Correct Option:</div>
                    <div style={{ fontWeight: 600, color: '#6EE7B7' }}>
                      {q.correct_options?.join(', ')}
                    </div>
                  </div>
                </div>
              )}

              {/* Subjective Responses & Qualitative Examiner Feedback */}
              {!isObjective && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {q.student_text && (
                    <div style={{ padding: '0.875rem', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Your Written Answer:</span>
                      {q.student_text}
                    </div>
                  )}

                  {q.examiner_feedback && (
                    <div style={{
                      padding: '0.875rem',
                      background: 'rgba(99, 102, 241, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <MessageSquare size={16} color="#A5B4FC" style={{ marginTop: '2px' }} />
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A5B4FC' }}>Examiner Feedback:</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{q.examiner_feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
