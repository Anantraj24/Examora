import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Sparkles, AlertCircle, Save, ArrowRight, 
  ArrowLeft, FileText, Bot, UserCheck, ShieldCheck,
  Send, Layers, HelpCircle
} from 'lucide-react';
import { GradingQueueItem } from '../types';
import { ImageAnnotationStudio } from './ImageAnnotationStudio';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export const ExaminerGradingStudio: React.FC = () => {
  const [queue, setQueue] = useState<GradingQueueItem[]>([
    {
      answer_id: 'ans-demo-03',
      session_id: 'sess-alex-01',
      student_id: 'st-alex',
      student_name: 'Alex Mercer',
      question_id: 'q-os-03',
      question_content: 'Explain the difference between Paging and Segmentation in modern virtual memory systems.',
      question_type: 'short_answer',
      max_marks: 5.0,
      model_answer: 'Paging divides memory into fixed-size physical frames and logical pages, eliminating external fragmentation. Segmentation divides memory into variable-sized logical segments (code, data, stack), avoiding internal fragmentation.',
      rubric_criteria: [
        { criterion: 'Defines fixed frames vs variable segments', points: 2.0 },
        { criterion: 'Identifies internal vs external fragmentation tradeoffs', points: 2.0 },
        { criterion: 'Clarity & technical accuracy', points: 1.0 }
      ],
      student_text_response: 'Paging divides memory into fixed-size physical blocks called frames and logical pages. This completely prevents external fragmentation. In contrast, segmentation splits memory into variable-sized logical segments like code, stack, and heap. While it avoids internal fragmentation, it can cause external fragmentation over time.',
      ai_evaluation: {
        suggested_score: 4.8,
        justification: 'Comprehensive technical explanation of paging fixed frames vs segmentation variable chunks. Correctly identifies fragmentation tradeoffs.',
        rubric_breakdown: {
          key_concepts_matched: ['paging', 'frames', 'pages', 'segmentation', 'external fragmentation', 'internal fragmentation'],
          key_concepts_missed: [],
          content_coverage_ratio: 0.96,
          criteria_scores: { 'Chunk allocation': '2.0/2.0', 'Fragmentation tradeoffs': '2.0/2.0', 'Clarity': '0.8/1.0' }
        }
      },
      current_examiner_score: 4.8,
      examiner_feedback: 'Excellent technical depth and clarity.'
    },
    {
      answer_id: 'ans-demo-04',
      session_id: 'sess-alex-01',
      student_id: 'st-alex',
      student_name: 'Alex Mercer',
      question_id: 'q-cap-04',
      question_content: 'Analyze the CAP Theorem in distributed databases. Discuss how modern partitioned systems balance consistency models using Quorum Consensus (R + W > N).',
      question_type: 'long_answer',
      max_marks: 10.0,
      model_answer: 'The CAP theorem states that a distributed data store can guarantee at most two out of Consistency, Availability, and Partition Tolerance. Under network partitions (P), systems choose between CP vs AP. Modern systems achieve tunable consistency using Quorum consensus (R + W > N).',
      rubric_criteria: [
        { criterion: 'Explains C, A, P definitions and impossibility proof', points: 3.0 },
        { criterion: 'Formulates Quorum math (R + W > N)', points: 4.0 },
        { criterion: 'Critiques latency tradeoffs & conflict resolution', points: 3.0 }
      ],
      student_text_response: 'The CAP Theorem proves that a distributed system cannot simultaneously achieve Consistency, Availability, and Partition Tolerance under network splits. When partitions happen, systems must choose between CP (consistent, unavailable during partition) and AP (available, eventual consistency). Modern databases utilize Quorum Consensus governed by R + W > N. When the read quorum R plus write quorum W exceeds the total replica count N, the read set is mathematically guaranteed to overlap with at least one updated replica containing the latest write timestamp, ensuring linearizable consistency.',
      ai_evaluation: {
        suggested_score: 9.5,
        justification: 'Rigorous explanation of CAP tradeoff, CP/AP models, and exact quorum formula (R + W > N) overlap proof.',
        rubric_breakdown: {
          key_concepts_matched: ['cap theorem', 'consistency', 'availability', 'partition tolerance', 'quorum consensus', 'r + w > n', 'linearizability'],
          key_concepts_missed: [],
          content_coverage_ratio: 0.95,
          criteria_scores: { 'C, A, P definitions': '3.0/3.0', 'Quorum math': '4.0/4.0', 'Tradeoffs': '2.5/3.0' }
        }
      },
      current_examiner_score: 9.5,
      examiner_feedback: 'Flawless mathematical formulation of quorum consistency.'
    },
    {
      answer_id: 'ans-demo-05',
      session_id: 'sess-alex-01',
      student_id: 'st-alex',
      student_name: 'Alex Mercer',
      question_id: 'q-btree-05',
      question_content: 'Draw and upload a handwritten or sketched diagram illustrating the step-by-step insertion of keys [10, 20, 5, 6, 12, 30] into a B-Tree of order 3.',
      question_type: 'image_upload',
      max_marks: 5.0,
      model_answer: 'B-tree of order 3 (max 2 keys per node). Splitting root when keys reach 3 items. Node splits result in balanced 2-level tree.',
      rubric_criteria: [
        { criterion: 'Correct root split on 3rd key', points: 2.5 },
        { criterion: 'Accurate child pointer balancing', points: 2.5 }
      ],
      student_text_response: '[Handwritten Diagram Attached]',
      ocr_extracted_text: 'B-Tree Order 3: Node Split at 10,20,5 -> Root [10], Left [5,6], Right [12,20,30]',
      ai_evaluation: {
        suggested_score: 4.5,
        justification: 'Correct B-tree node split points and balanced child pointers based on OCR transcript & visual schematic.',
        rubric_breakdown: {
          key_concepts_matched: ['b-tree', 'order 3', 'root split', 'child pointers'],
          key_concepts_missed: [],
          content_coverage_ratio: 0.90
        }
      },
      current_examiner_score: 4.5,
      examiner_feedback: 'Clean diagrammatic representation.'
    }
  ]);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [givenScore, setGivenScore] = useState<number>(4.8);
  const [feedback, setFeedback] = useState<string>('Excellent technical depth and clarity.');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishedSuccess, setPublishedSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function loadQueue() {
      try {
        const data = await api.getGradingQueue();
        if (data && data.length > 0) {
          setQueue(data);
        }
      } catch (e) {
        console.warn('Grading queue fetch fallback', e);
      }
    }
    loadQueue();
  }, []);

  const currentItem = queue[currentIdx];

  useEffect(() => {
    if (currentItem) {
      setGivenScore(currentItem.current_examiner_score ?? currentItem.ai_evaluation?.suggested_score ?? currentItem.max_marks * 0.8);
      setFeedback(currentItem.examiner_feedback || currentItem.ai_evaluation?.justification || '');
    }
  }, [currentIdx, currentItem]);

  const handleAcceptAIScore = () => {
    if (currentItem?.ai_evaluation) {
      setGivenScore(currentItem.ai_evaluation.suggested_score);
      setFeedback(currentItem.ai_evaluation.justification);
    }
  };

  const handleSaveGrade = async () => {
    if (!currentItem) return;
    setIsSaving(true);
    try {
      await api.submitExaminerGrade({
        answer_id: currentItem.answer_id,
        final_score: givenScore,
        examiner_feedback: feedback
      });
    } catch (e) {
      console.warn('Grade submit fallback', e);
    }
    setIsSaving(false);
    if (currentIdx < queue.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePublishAll = async () => {
    setIsPublishing(true);
    try {
      await api.publishExamResults('exam-01');
    } catch (e) {
      console.warn('Publish fallback', e);
    }
    setIsPublishing(false);
    setPublishedSuccess(true);
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
  };

  if (!currentItem) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <CheckCircle2 size={48} color="#10B981" />
        <h3 style={{ marginTop: '1rem' }}>All Submissions Evaluated</h3>
        <p style={{ color: 'var(--text-secondary)' }}>The grading queue is clear.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* Studio Header Bar */}
      <div className="glass-panel" style={{
        padding: '1.25rem 2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF'
          }}>
            <Bot size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-indigo">AI Co-Pilot Grading Studio</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submission {currentIdx + 1} of {queue.length}</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Candidate: {currentItem.student_name}</h3>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
          >
            <ArrowLeft size={16} />
            Previous
          </button>

          <button
            className="btn btn-secondary"
            disabled={currentIdx === queue.length - 1}
            onClick={() => setCurrentIdx((p) => Math.min(queue.length - 1, p + 1))}
          >
            Next
            <ArrowRight size={16} />
          </button>

          <button
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderColor: '#10B981' }}
            disabled={isPublishing}
            onClick={handlePublishAll}
          >
            <Send size={16} />
            {publishedSuccess ? 'Results Published' : 'Publish Cohort Results'}
          </button>
        </div>
      </div>

      {/* Split Screen Grading Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Question, Model Answer & Rubric Breakdown */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="badge badge-indigo">Question Specification</span>
              <span className="badge badge-emerald">Max: {currentItem.max_marks} Marks</span>
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.5 }}>
              {currentItem.question_content}
            </h4>
          </div>

          {/* Model Answer */}
          <div style={{
            background: 'var(--bg-surface)',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)'
          }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Standard Model Answer Key
            </h5>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {currentItem.model_answer}
            </p>
          </div>

          {/* Rubric Criteria Table */}
          {currentItem.rubric_criteria && (
            <div>
              <h5 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Grading Rubric Criteria
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentItem.rubric_criteria.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'var(--bg-surface)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span>{r.criterion}</span>
                    <span className="badge badge-indigo">+{r.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Semantic Concept Analysis */}
          {currentItem.ai_evaluation?.rubric_breakdown && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '10px',
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={16} color="#A5B4FC" />
                <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#A5B4FC', margin: 0 }}>
                  AI Semantic Keyword Matches
                </h5>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {currentItem.ai_evaluation.rubric_breakdown.key_concepts_matched?.map((term: string, idx: number) => (
                  <span key={idx} className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                    ✓ {term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Student Response, Canvas & Scoring Sliders */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Candidate Written or OCR Response */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="badge badge-indigo">Candidate Submission</span>
              {currentItem.ocr_extracted_text && (
                <span className="badge badge-emerald">OCR Extracted</span>
              )}
            </div>

            {/* If Image/Diagram Type */}
            {currentItem.question_type === 'image_upload' ? (
              <div style={{ marginBottom: '1rem' }}>
                <ImageAnnotationStudio />
                {currentItem.ocr_extracted_text && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.875rem',
                    background: 'var(--bg-surface)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <strong style={{ color: '#F8FAFC' }}>OCR Transcript: </strong>
                    {currentItem.ocr_extracted_text}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-surface)',
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: '#F8FAFC'
              }}>
                {currentItem.student_text_response}
              </div>
            )}
          </div>

          {/* AI Pre-Score Recommendation Card */}
          {currentItem.ai_evaluation && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Bot size={16} color="#A5B4FC" />
                  <span style={{ fontSize: '0.8rem', color: '#A5B4FC', fontWeight: 600 }}>AI Suggested Grade</span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                  {currentItem.ai_evaluation.suggested_score} / {currentItem.max_marks}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  {currentItem.ai_evaluation.justification}
                </p>
              </div>

              <button
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                onClick={handleAcceptAIScore}
              >
                Accept AI Grade
              </button>
            </div>
          )}

          {/* Examiner Grade Override & Feedback */}
          <div style={{
            background: 'var(--bg-surface)',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Assigned Score (Marks):</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {Number(givenScore).toFixed(1)} / {currentItem.max_marks}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={currentItem.max_marks}
                step="0.5"
                value={givenScore}
                onChange={(e) => setGivenScore(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Examiner Qualitative Feedback:
              </span>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add constructive academic feedback for the candidate..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={isSaving}
              onClick={handleSaveGrade}
            >
              <Save size={16} />
              {isSaving ? 'Saving Grade...' : 'Save & Grade Next Submission'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
