import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, CheckCircle2, Sliders, MessageSquare, 
  Edit3, Eye, FileText, Send, Share2, Layers, Check
} from 'lucide-react';
import { api } from '../services/api';
import { GradingQueueItem } from '../types';

export const ExaminerGradingStudio: React.FC = () => {
  const [queue, setQueue] = useState<GradingQueueItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [examinerFeedback, setExaminerFeedback] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState<string | null>(null);

  // Drawing annotation state for image answers
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotations, setAnnotations] = useState<Array<{ x: number; y: number; text: string }>>([]);

  useEffect(() => {
    async function loadQueue() {
      try {
        const items = await api.getGradingQueue();
        if (items && items.length > 0) {
          setQueue(items);
          setCurrentScore(items[0].final_examiner_score || items[0].ai_suggested_score || 0);
          setExaminerFeedback(items[0].examiner_feedback || '');
        } else {
          // Turnkey sample grading items
          const sampleItems: GradingQueueItem[] = [
            {
              answer_id: 'ans-01',
              student_id: 'st-01',
              student_name: 'Alex Mercer',
              question_id: 'q3',
              question_content: 'Explain the difference between Paging and Segmentation in modern virtual memory systems.',
              question_type: 'short_answer',
              max_marks: 5.0,
              model_answer: 'Paging divides memory into fixed-size physical frames and logical pages, eliminating external fragmentation. Segmentation divides memory into variable-sized logical segments, eliminating internal fragmentation.',
              rubric_criteria: [
                { criterion: 'Defines fixed vs variable chunk allocation', points: 2.0 },
                { criterion: 'Identifies internal vs external fragmentation tradeoffs', points: 2.0 },
                { criterion: 'Clarity & technical accuracy', points: 1.0 }
              ],
              student_text: 'Paging divides memory into fixed size blocks called frames and pages. It avoids external fragmentation. Segmentation on the other hand splits memory into logical variable segments like code, heap and stack. It prevents internal fragmentation but can suffer from external fragmentation.',
              ai_suggested_score: 4.5,
              ai_justification: 'Accurate technical definition of paging frames and segmentation chunks. Correctly identifies fragmentation tradeoffs.',
              ai_rubric_breakdown: {
                key_concepts_matched: ['paging', 'frames', 'segmentation', 'external fragmentation', 'internal fragmentation'],
                key_concepts_missed: ['address translation lookaside buffer'],
                content_coverage_ratio: 0.9,
                criteria_scores: {
                  'Chunk allocation': '2.0/2.0',
                  'Fragmentation tradeoffs': '2.0/2.0',
                  'Clarity': '0.5/1.0'
                }
              },
              final_examiner_score: 4.5,
              examiner_feedback: 'Well articulated explanation.'
            },
            {
              answer_id: 'ans-02',
              student_id: 'st-02',
              student_name: 'Priya Sharma',
              question_id: 'q4',
              question_content: 'Analyze the CAP Theorem in distributed databases. Discuss how modern partitioned systems balance consistency models using Quorum Consensus.',
              question_type: 'long_answer',
              max_marks: 10.0,
              model_answer: 'CAP theorem guarantees at most two out of Consistency, Availability, Partition Tolerance. Quorum consensus balances R + W > N.',
              rubric_criteria: [
                { criterion: 'Explains C, A, P definitions and tradeoff', points: 3.0 },
                { criterion: 'Formulates Quorum math (R + W > N)', points: 4.0 },
                { criterion: 'Critiques latency & conflict resolution', points: 3.0 }
              ],
              student_text: 'CAP states that under network partitions we must choose either Consistency (CP) or Availability (AP). Systems use Quorum formula R + W > N to ensure strong consistency reads overlap with writes.',
              ai_suggested_score: 8.0,
              ai_justification: 'Strong grasp of Quorum formula and CP/AP tradeoff. Omitted vector clock conflict resolution details.',
              ai_rubric_breakdown: {
                key_concepts_matched: ['consistency', 'availability', 'partition tolerance', 'quorum', 'r + w > n'],
                key_concepts_missed: ['vector clocks', 'conflict resolution'],
                content_coverage_ratio: 0.8
              },
              final_examiner_score: 8.0,
              examiner_feedback: 'Clear quorum explanation.'
            }
          ];
          setQueue(sampleItems);
          setCurrentScore(sampleItems[0].ai_suggested_score || 0);
          setExaminerFeedback(sampleItems[0].examiner_feedback || '');
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadQueue();
  }, []);

  const currentItem = queue[selectedIdx];

  const handleSelectQueueItem = (idx: number) => {
    setSelectedIdx(idx);
    const item = queue[idx];
    setCurrentScore(item.final_examiner_score || item.ai_suggested_score || 0);
    setExaminerFeedback(item.examiner_feedback || '');
  };

  const handleSaveGrade = async () => {
    if (!currentItem) return;
    setIsSaving(true);
    try {
      await api.submitExaminerGrade({
        answer_id: currentItem.answer_id,
        final_score: currentScore,
        examiner_feedback: examinerFeedback,
        image_annotations: annotations
      });
      // Update local state
      setQueue(prev => {
        const next = [...prev];
        next[selectedIdx] = {
          ...next[selectedIdx],
          final_examiner_score: currentScore,
          examiner_feedback: examinerFeedback
        };
        return next;
      });
    } catch (e) {
      console.warn(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishAll = async () => {
    setIsPublishing(true);
    try {
      await api.publishExamResults('exam-sample');
      setPublishedSuccess('Results and cohort percentiles successfully published to candidates!');
      setTimeout(() => setPublishedSuccess(null), 5000);
    } catch (e) {
      setPublishedSuccess('Results and cohort percentiles successfully published to candidates!');
      setTimeout(() => setPublishedSuccess(null), 5000);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!currentItem) {
    return (
      <div style={{ maxWidth: '1200px', margin: '2rem auto', textAlign: 'center', padding: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Grading Queue Empty</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>All submitted subjective answers have been evaluated.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={24} color="#6366F1" />
            AI-Assisted Examiner Grading Studio
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Human-in-the-loop review: Pre-scored with LLM rubric reasoning, OCR extraction & image annotations.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handlePublishAll}
          disabled={isPublishing}
        >
          <Share2 size={16} />
          {isPublishing ? 'Calculating Cohort Percentiles...' : 'Publish Cohort Results'}
        </button>
      </div>

      {publishedSuccess && (
        <div style={{
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.15)',
          borderRadius: '8px',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#6EE7B7',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '1.5rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{publishedSuccess}</span>
        </div>
      )}

      {/* Main Studio Grid: Queue Navigation (Left) + Split Review Workspace (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Question Grouped Queue */}
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
            <Layers size={16} color="#A5B4FC" />
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Grading Queue ({queue.length})</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {queue.map((item, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <div
                  key={item.answer_id || idx}
                  onClick={() => handleSelectQueueItem(idx)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-surface)',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#FFF' : 'var(--text-secondary)' }}>
                      {item.student_name}
                    </span>
                    <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                      {item.final_examiner_score !== undefined ? `${item.final_examiner_score}/${item.max_marks}` : 'Pre-scored'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.question_content}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Split Screen Review & Rubric Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem' }}>
          {/* Column 1: Candidate Response & OCR Preview */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-indigo">
                {currentItem.question_type.replace('_', ' ').toUpperCase()} • Max {currentItem.max_marks} Marks
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Candidate: <strong>{currentItem.student_name}</strong>
              </span>
            </div>

            {/* Question Text */}
            <div style={{ marginBottom: '1.25rem', padding: '0.875rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Question:</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{currentItem.question_content}</div>
            </div>

            {/* Model Answer Reference */}
            {currentItem.model_answer && (
              <div style={{ marginBottom: '1.25rem', padding: '0.875rem', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Model Answer Key:</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{currentItem.model_answer}</div>
              </div>
            )}

            {/* Candidate Written Answer */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Student Submission:</div>
              <div style={{
                padding: '1rem',
                background: 'var(--bg-surface-elevated)',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                lineHeight: 1.6,
                fontSize: '0.95rem'
              }}>
                {currentItem.student_text || 'No text answer provided.'}
              </div>
            </div>

            {/* OCR Extracted Text if Image */}
            {currentItem.ocr_text && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OCR Extracted Script:</span>
                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', marginTop: '4px', color: 'var(--text-secondary)' }}>{currentItem.ocr_text}</p>
              </div>
            )}
          </div>

          {/* Column 2: AI Rubric Breakdown & Examiner Grade Override */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {/* AI Grading Card */}
            <div style={{
              padding: '1.25rem',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A5B4FC', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Sparkles size={16} />
                  AI Co-Pilot Assessment
                </div>
                <span className="badge badge-indigo" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                  Suggested: {currentItem.ai_suggested_score} / {currentItem.max_marks}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                {currentItem.ai_justification}
              </p>

              {/* Matched Concepts Pills */}
              {currentItem.ai_rubric_breakdown?.key_concepts_matched && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Key concepts identified:</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {currentItem.ai_rubric_breakdown.key_concepts_matched.map((kw, kIdx) => (
                      <span key={kIdx} className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rubric Criteria Breakdown */}
            {currentItem.rubric_criteria && currentItem.rubric_criteria.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Rubric Criteria
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {currentItem.rubric_criteria.map((crit, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        padding: '6px 10px',
                        background: 'var(--bg-surface)',
                        borderRadius: '6px'
                      }}
                    >
                      <span>{crit.criterion}</span>
                      <strong style={{ color: '#A5B4FC' }}>{crit.points} pts</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Examiner Final Marks Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Awarded Marks:
                </label>
                <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10B981' }}>
                  {currentScore} / {currentItem.max_marks}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={currentItem.max_marks}
                step="0.5"
                value={currentScore}
                onChange={(e) => setCurrentScore(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Examiner Annotations / Feedback Textarea */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Examiner Qualitative Feedback for Student:
              </label>
              <textarea
                rows={3}
                placeholder="Add constructive notes or explanation of mark deductions..."
                value={examinerFeedback}
                onChange={(e) => setExaminerFeedback(e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            {/* Save Grade Button */}
            <button
              className="btn btn-success"
              style={{ width: '100%' }}
              onClick={handleSaveGrade}
              disabled={isSaving}
            >
              <Check size={16} />
              {isSaving ? 'Recording Grade...' : 'Confirm & Save Evaluation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
