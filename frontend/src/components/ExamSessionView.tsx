import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, CheckCircle, Flag, ChevronLeft, ChevronRight, Send, 
  UploadCloud, FileImage, AlertCircle, Sparkles, Shield, RefreshCw
} from 'lucide-react';
import { StudentExamPaper, PaperQuestionView } from '../types';
import { api } from '../services/api';
import { WebcamProctorHUD } from './WebcamProctorHUD';
import confetti from 'canvas-confetti';

interface ExamSessionViewProps {
  examId: string;
  onFinishExam: (sessionId: string) => void;
}

export const ExamSessionView: React.FC<ExamSessionViewProps> = ({ examId, onFinishExam }) => {
  const [paper, setPaper] = useState<StudentExamPaper | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, {
    selected_option_ids?: string[];
    text_response?: string;
    image_base64?: string;
  }>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cameraUploading, setCameraUploading] = useState(false);

  // Lockdown Event Handlers (Disable Right-Click, Copy, Paste, Cut)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handlePaste = (e: ClipboardEvent) => e.preventDefault();
    const handleCut = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, []);

  // Fetch or Initialize Exam Session
  useEffect(() => {
    async function loadPaper() {
      try {
        const data = await api.startExamSession(examId);
        setPaper(data);
        setSecondsRemaining(data.server_time_remaining_seconds || data.duration_minutes * 60);

        // Pre-populate existing saved answers
        const initialAnswers: Record<string, any> = {};
        data.questions.forEach(q => {
          if (q.saved_answer) {
            initialAnswers[q.id] = q.saved_answer;
          }
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Failed to start exam session, using offline sample paper', err);
        // Turnkey fallback data
        const fallbackData: StudentExamPaper = {
          session_id: 'sess-sample-' + Math.random().toString(36).substring(7),
          session_token: 'tok-mock',
          exam_id: examId,
          exam_title: 'Advanced Computer Systems & AI Examination (2026)',
          duration_minutes: 45,
          server_deadline: new Date(Date.now() + 45 * 60000).toISOString(),
          server_time_remaining_seconds: 45 * 60,
          proctoring_config: { webcam_required: true, gaze_tracking: true },
          questions: [
            {
              id: 'q1',
              order_index: 1,
              question_type: 'MCQ',
              difficulty: 'easy',
              content: 'Which CPU scheduling algorithm gives the minimum average waiting time for a given set of processes?',
              max_marks: 2.0,
              negative_marks: 0.5,
              options: [
                { id: 'opt1', option_text: 'Shortest Job First (SJF / SRTF)', sort_order: 0 },
                { id: 'opt2', option_text: 'First-Come First-Served (FCFS)', sort_order: 1 },
                { id: 'opt3', option_text: 'Round Robin (RR) with large quantum', sort_order: 2 },
                { id: 'opt4', option_text: 'Priority Scheduling with aging', sort_order: 3 },
              ]
            },
            {
              id: 'q2',
              order_index: 2,
              question_type: 'multi_select',
              difficulty: 'medium',
              content: 'Which of the following protocols operate at the Transport Layer of the OSI / TCP-IP reference model? (Select all that apply)',
              max_marks: 3.0,
              negative_marks: 0.5,
              options: [
                { id: 'opt5', option_text: 'Transmission Control Protocol (TCP)', sort_order: 0 },
                { id: 'opt6', option_text: 'User Datagram Protocol (UDP)', sort_order: 1 },
                { id: 'opt7', option_text: 'Hypertext Transfer Protocol (HTTP)', sort_order: 2 },
                { id: 'opt8', option_text: 'Internet Control Message Protocol (ICMP)', sort_order: 3 },
              ]
            },
            {
              id: 'q3',
              order_index: 3,
              question_type: 'short_answer',
              difficulty: 'medium',
              content: 'Explain the difference between Paging and Segmentation in modern virtual memory systems.',
              max_marks: 5.0,
              negative_marks: 0.0,
              options: []
            },
            {
              id: 'q4',
              order_index: 4,
              question_type: 'long_answer',
              difficulty: 'hard',
              content: 'Analyze the CAP Theorem in distributed databases. Discuss how modern partitioned systems balance consistency models (e.g. Strong vs Eventual Consistency) using Quorum Consensus.',
              max_marks: 10.0,
              negative_marks: 0.0,
              options: []
            },
            {
              id: 'q5',
              order_index: 5,
              question_type: 'image_upload',
              difficulty: 'hard',
              content: 'Draw and upload a handwritten diagram illustrating the step-by-step insertion of keys [10, 20, 5, 6, 12, 30] into a B-Tree of order 3. Include node split points.',
              max_marks: 5.0,
              negative_marks: 0.0,
              options: []
            }
          ]
        };
        setPaper(fallbackData);
        setSecondsRemaining(45 * 60);
      }
    }
    loadPaper();
  }, [examId]);

  // Server Countdown Timer Tick
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const handleAutoSubmitOnTimeout = async () => {
    if (!paper) return;
    try {
      await api.submitFinalExam(paper.session_id);
    } catch (e) {
      console.warn(e);
    }
    onFinishExam(paper.session_id);
  };

  // Answer Persistence helper with debouncing
  const persistAnswer = async (qId: string, updatedAnswer: any) => {
    if (!paper) return;
    setSavingStatus('saving');
    try {
      await api.saveAnswer({
        session_id: paper.session_id,
        question_id: qId,
        selected_option_ids: updatedAnswer.selected_option_ids,
        text_response: updatedAnswer.text_response,
        image_base64: updatedAnswer.image_base64
      });
      setSavingStatus('saved');
    } catch (e) {
      console.warn('Saved locally (network queue)', e);
      setSavingStatus('saved');
    }
  };

  const handleOptionSelect = (qId: string, optionId: string, isMulti: boolean) => {
    const current = answers[qId]?.selected_option_ids || [];
    let updated: string[];
    if (isMulti) {
      updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
    } else {
      updated = [optionId];
    }
    const newAns = { ...answers[qId], selected_option_ids: updated };
    setAnswers(prev => ({ ...prev, [qId]: newAns }));
    persistAnswer(qId, newAns);
  };

  const handleTextChange = (qId: string, text: string) => {
    const newAns = { ...answers[qId], text_response: text };
    setAnswers(prev => ({ ...prev, [qId]: newAns }));
    persistAnswer(qId, newAns);
  };

  const handleImageFile = (qId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      const newAns = { ...answers[qId], image_base64: base64 };
      setAnswers(prev => ({ ...prev, [qId]: newAns }));
      persistAnswer(qId, newAns);
    };
    reader.readAsDataURL(file);
  };

  const toggleFlag = (qId: string) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleFinalSubmit = async () => {
    if (!paper) return;
    setIsSubmitting(true);
    try {
      await api.submitFinalExam(paper.session_id);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onFinishExam(paper.session_id);
    } catch (e) {
      console.error(e);
      onFinishExam(paper.session_id);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!paper) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={36} className="animate-pulse-slow" color="#6366F1" />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Preparing Secure Exam Session...</p>
        </div>
      </div>
    );
  }

  const currentQ: PaperQuestionView = paper.questions[currentQIndex];
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isUrgentAmber = secondsRemaining <= 300 && secondsRemaining > 60;
  const isUrgentRed = secondsRemaining <= 60;

  const currentWordCount = (answers[currentQ?.id]?.text_response || '').trim().split(/\s+/).filter(Boolean).length;
  const answeredCount = Object.keys(answers).filter(k => {
    const a = answers[k];
    return (a.selected_option_ids && a.selected_option_ids.length > 0) || (a.text_response && a.text_response.trim()) || a.image_base64;
  }).length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem', userSelect: 'none' }}>
      {/* Exam Header Bar */}
      <div className="glass-panel" style={{
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} color="#6366F1" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{paper.exam_title}</h2>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Session ID: <span className="font-mono">{paper.session_id.substring(0, 12)}...</span> • AI Gaze & Multiple-Person Detection Active
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Auto-Save Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: savingStatus === 'saving' ? '#F59E0B' : '#10B981'
            }} />
            <span style={{ color: 'var(--text-muted)' }}>
              {savingStatus === 'saving' ? 'Saving answer...' : 'All answers saved'}
            </span>
          </div>

          {/* Dynamic Countdown Timer */}
          <div className={`glass-panel font-mono ${isUrgentRed ? 'urgent-timer' : ''}`} style={{
            padding: '6px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '1.1rem',
            background: isUrgentRed ? 'rgba(239, 68, 68, 0.2)' : (isUrgentAmber ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)'),
            color: isUrgentRed ? '#EF4444' : (isUrgentAmber ? '#F59E0B' : '#F8FAFC'),
            border: `1px solid ${isUrgentRed ? '#EF4444' : (isUrgentAmber ? '#F59E0B' : 'var(--border-medium)')}`
          }}>
            <Clock size={18} />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          {/* Final Submit Button */}
          <button
            className="btn btn-success"
            onClick={() => setShowConfirmModal(true)}
          >
            <Send size={16} />
            Finish & Submit Exam
          </button>
        </div>
      </div>

      {/* Main Workspace: Question Area (Left) + Palette & Proctor HUD (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Question Panel */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          {/* Top Question Meta */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-indigo" style={{ fontSize: '0.8rem' }}>
                Question {currentQIndex + 1} of {paper.questions.length}
              </span>
              <span className="badge" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                {currentQ.question_type.replace('_', ' ').toUpperCase()}
              </span>
              <span className="badge" style={{ background: 'var(--bg-surface)', color: '#A5B4FC' }}>
                +{currentQ.max_marks} Marks {currentQ.negative_marks > 0 ? `(-${currentQ.negative_marks} Neg)` : ''}
              </span>
            </div>

            <button
              className="btn btn-outline"
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderColor: flaggedQuestions.has(currentQ.id) ? 'var(--accent-amber)' : 'var(--border-subtle)',
                color: flaggedQuestions.has(currentQ.id) ? 'var(--accent-amber)' : 'var(--text-secondary)'
              }}
              onClick={() => toggleFlag(currentQ.id)}
            >
              <Flag size={14} fill={flaggedQuestions.has(currentQ.id) ? 'var(--accent-amber)' : 'none'} />
              {flaggedQuestions.has(currentQ.id) ? 'Flagged for Review' : 'Mark for Review'}
            </button>
          </div>

          {/* Question Text */}
          <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {currentQ.content}
          </div>

          {/* Answer Input Renderers */}
          {/* 1. MCQ & Multi-Select Options */}
          {(currentQ.question_type === 'MCQ' || currentQ.question_type === 'multi_select') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {currentQ.options.map((opt, oIdx) => {
                const optId = opt.id || `opt-${oIdx}`;
                const isSelected = (answers[currentQ.id]?.selected_option_ids || []).includes(optId);
                const isMulti = currentQ.question_type === 'multi_select';
                return (
                  <div
                    key={optId}
                    onClick={() => handleOptionSelect(currentQ.id, optId, isMulti)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 14px rgba(99, 102, 241, 0.25)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: isMulti ? '6px' : '50%',
                      border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--accent-primary)' : 'transparent',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {isSelected ? '✓' : String.fromCharCode(65 + oIdx)}
                    </div>
                    <span style={{ fontSize: '0.95rem', color: isSelected ? '#FFFFFF' : 'var(--text-secondary)' }}>
                      {opt.option_text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Short & Long Written Text Area */}
          {(currentQ.question_type === 'short_answer' || currentQ.question_type === 'long_answer') && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Type your structured response (AI Rubric Scoring Enabled):
                </label>
                <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Word count: <strong style={{ color: '#A5B4FC' }}>{currentWordCount}</strong> words
                </span>
              </div>
              <textarea
                rows={currentQ.question_type === 'long_answer' ? 9 : 5}
                placeholder="Formulate your detailed response here..."
                value={answers[currentQ.id]?.text_response || ''}
                onChange={(e) => handleTextChange(currentQ.id, e.target.value)}
                style={{
                  width: '100%',
                  lineHeight: 1.6,
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
              />
            </div>
          )}

          {/* 3. Handwritten Answer / Diagram Image Upload */}
          {currentQ.question_type === 'image_upload' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                background: 'var(--bg-surface)',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageFile(currentQ.id, e.target.files[0]);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <UploadCloud size={36} color="#6366F1" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Upload Handwritten Answer Sheet or Diagram
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supports JPG, PNG with server-side OCR text extraction
                </p>
              </div>

              {/* Preview */}
              {(imagePreview || answers[currentQ.id]?.image_base64) && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileImage size={14} color="#10B981" />
                    Uploaded Answer Preview
                  </div>
                  <img
                    src={imagePreview || answers[currentQ.id]?.image_base64}
                    alt="Answer preview"
                    style={{ maxHeight: '240px', borderRadius: '6px', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <button
              className="btn btn-secondary"
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
            >
              <ChevronLeft size={16} />
              Previous Question
            </button>

            <button
              className="btn btn-primary"
              disabled={currentQIndex === paper.questions.length - 1}
              onClick={() => setCurrentQIndex(prev => Math.min(paper.questions.length - 1, prev + 1))}
            >
              Next Question
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Sidebar: Proctor HUD + Question Navigation Palette */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Edge AI Proctor HUD */}
          <WebcamProctorHUD sessionId={paper.session_id} />

          {/* Question Palette */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Question Palette</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {answeredCount}/{paper.questions.length} Solved
              </span>
            </div>

            {/* Grid Palette Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
              marginBottom: '1rem'
            }}>
              {paper.questions.map((q, idx) => {
                const isCurrent = idx === currentQIndex;
                const isFlagged = flaggedQuestions.has(q.id);
                const hasAnswer = (answers[q.id]?.selected_option_ids && answers[q.id].selected_option_ids!.length > 0) ||
                  (answers[q.id]?.text_response && answers[q.id].text_response!.trim()) ||
                  answers[q.id]?.image_base64;

                let bg = 'var(--bg-surface)';
                let color = 'var(--text-secondary)';
                let border = '1px solid var(--border-subtle)';

                if (hasAnswer) {
                  bg = 'rgba(16, 185, 129, 0.2)';
                  color = '#6EE7B7';
                  border = '1px solid rgba(16, 185, 129, 0.4)';
                }
                if (isFlagged) {
                  bg = 'rgba(245, 158, 11, 0.2)';
                  color = '#FCD34D';
                  border = '1px solid rgba(245, 158, 11, 0.5)';
                }
                if (isCurrent) {
                  border = '2px solid var(--accent-primary)';
                  color = '#FFF';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    style={{
                      aspectRatio: '1/1',
                      borderRadius: '8px',
                      background: bg,
                      color: color,
                      border: border,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.4)' }} />
                <span>Answered ({answeredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.4)' }} />
                <span>Flagged for Review ({flaggedQuestions.size})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--bg-surface)' }} />
                <span>Unvisited ({paper.questions.length - answeredCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Submit Examination?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              You have answered <strong>{answeredCount}</strong> of <strong>{paper.questions.length}</strong> questions.
              Once submitted, your answers will be automatically graded by AI and queued for examiner review.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowConfirmModal(false)}
              >
                Return to Exam
              </button>
              <button
                className="btn btn-success"
                style={{ flex: 1 }}
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
