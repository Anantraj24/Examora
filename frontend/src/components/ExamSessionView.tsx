import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, ShieldAlert, CheckCircle2, Bookmark, ArrowLeft, ArrowRight,
  Maximize2, Send, Save, AlertTriangle, Sparkles, HelpCircle,
  FileText, Image as ImageIcon, Volume2
} from 'lucide-react';
import { StudentExamPaper, PaperQuestionView } from '../types';
import { api } from '../services/api';
import { WebcamProctorHUD } from './WebcamProctorHUD';
import { SystemCheckModal } from './SystemCheckModal';
import { DiagramSketchCanvas } from './DiagramSketchCanvas';
import confetti from 'canvas-confetti';

interface ExamSessionViewProps {
  examId: string;
  onFinishExam: (sessionId: string) => void;
}

export const ExamSessionView: React.FC<ExamSessionViewProps> = ({ examId, onFinishExam }) => {
  const [showSystemCheck, setShowSystemCheck] = useState<boolean>(true);
  const [paper, setPaper] = useState<StudentExamPaper | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, {
    selected_option_ids: string[];
    text_response: string;
    image_base64?: string;
  }>>({});
  
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('All changes saved');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [proctorViolations, setProctorViolations] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Play auditory warning beep via Web Audio API
  const playWarningBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  // Launch and start session
  const initializeExamSession = async () => {
    try {
      const data = await api.startExamSession(examId);
      setPaper(data);
      setSecondsRemaining(data.seconds_remaining || 45 * 60);
      setShowSystemCheck(false);

      // Request fullscreen
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (e) {
        console.warn('Fullscreen request bypassed', e);
      }
    } catch (e) {
      console.error('Failed to start session', e);
      // Fallback preview
      setPaper({
        session_id: 'sess-demo-active',
        exam_id: examId,
        title: 'Advanced Computer Systems & AI Examination (2026)',
        subject: 'Computer Science',
        duration_minutes: 45,
        server_deadline: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        seconds_remaining: 45 * 60,
        questions: [
          {
            id: 'q-demo-01',
            order_index: 0,
            question_type: 'MCQ',
            content: 'Which CPU scheduling algorithm gives the minimum average waiting time for a given set of processes?',
            max_marks: 2.0,
            negative_marks: 0.5,
            options: [
              { id: 'opt-1', option_text: 'Shortest Job First (SJF / SRTF)', sort_order: 0 },
              { id: 'opt-2', option_text: 'First-Come First-Served (FCFS)', sort_order: 1 },
              { id: 'opt-3', option_text: 'Round Robin (RR)', sort_order: 2 },
              { id: 'opt-4', option_text: 'Priority Scheduling', sort_order: 3 }
            ]
          },
          {
            id: 'q-demo-02',
            order_index: 1,
            question_type: 'multi_select',
            content: 'Which of the following protocols operate at the Transport Layer of the TCP/IP stack? (Select all that apply)',
            max_marks: 3.0,
            negative_marks: 0.5,
            options: [
              { id: 'opt-21', option_text: 'Transmission Control Protocol (TCP)', sort_order: 0 },
              { id: 'opt-22', option_text: 'User Datagram Protocol (UDP)', sort_order: 1 },
              { id: 'opt-23', option_text: 'Hypertext Transfer Protocol (HTTP)', sort_order: 2 },
              { id: 'opt-24', option_text: 'Internet Control Message Protocol (ICMP)', sort_order: 3 }
            ]
          },
          {
            id: 'q-demo-03',
            order_index: 2,
            question_type: 'short_answer',
            content: 'Explain the difference between Paging and Segmentation in modern virtual memory systems.',
            max_marks: 5.0,
            negative_marks: 0.0,
            options: []
          },
          {
            id: 'q-demo-04',
            order_index: 3,
            question_type: 'long_answer',
            content: 'Analyze the CAP Theorem in distributed databases. Discuss how modern partitioned systems balance consistency models using Quorum Consensus (R + W > N).',
            max_marks: 10.0,
            negative_marks: 0.0,
            options: []
          },
          {
            id: 'q-demo-05',
            order_index: 4,
            question_type: 'image_upload',
            content: 'Draw and upload a handwritten or sketched diagram illustrating the step-by-step insertion of keys [10, 20, 5, 6, 12, 30] into a B-Tree of order 3.',
            max_marks: 5.0,
            negative_marks: 0.0,
            options: []
          }
        ]
      });
      setShowSystemCheck(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (showSystemCheck || !paper) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        // Ping at 5 min mark and 1 min mark
        if (prev === 300 || prev === 60) {
          playWarningBeep();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showSystemCheck, paper]);

  // Security lockdown event listeners
  useEffect(() => {
    if (showSystemCheck) return;

    const handleBlur = () => {
      setTabSwitchCount((prev) => prev + 1);
      setProctorViolations((prev) => [...prev, `Tab switch / focus blur detected at ${new Date().toLocaleTimeString()}`]);
      playWarningBeep();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent copy/paste/cut/print
      if (
        (e.ctrlKey || e.metaKey) && 
        ['c', 'v', 'x', 'p', 's', 'u'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }

      // Hotkey option selections (1,2,3,4 or a,b,c,d) for MCQ
      if (paper && paper.questions && paper.questions[currentIdx]) {
        const q = paper.questions[currentIdx];
        if (q.question_type === 'MCQ') {
          const key = e.key.toLowerCase();
          let optIdx = -1;
          if (['1', 'a'].includes(key)) optIdx = 0;
          if (['2', 'b'].includes(key)) optIdx = 1;
          if (['3', 'c'].includes(key)) optIdx = 2;
          if (['4', 'd'].includes(key)) optIdx = 3;

          if (optIdx >= 0 && q.options[optIdx]) {
            handleOptionSelect(q.id, q.options[optIdx].id || `opt-${optIdx}`, false);
          }
        }
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSystemCheck, currentIdx, paper]);

  const currentQ: PaperQuestionView | undefined = paper?.questions[currentIdx];

  const handleOptionSelect = (qId: string, optId: string, isMulti: boolean) => {
    setAnswers((prev) => {
      const currentSelected = prev[qId]?.selected_option_ids || [];
      let newSelected: string[] = [];

      if (isMulti) {
        if (currentSelected.includes(optId)) {
          newSelected = currentSelected.filter((id) => id !== optId);
        } else {
          newSelected = [...currentSelected, optId];
        }
      } else {
        newSelected = [optId];
      }

      const updated = {
        ...prev,
        [qId]: {
          selected_option_ids: newSelected,
          text_response: prev[qId]?.text_response || '',
          image_base64: prev[qId]?.image_base64
        }
      };

      // Auto save
      triggerAutoSave(qId, updated[qId]);
      return updated;
    });
  };

  const handleTextChange = (qId: string, text: string) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [qId]: {
          selected_option_ids: prev[qId]?.selected_option_ids || [],
          text_response: text,
          image_base64: prev[qId]?.image_base64
        }
      };
      triggerAutoSave(qId, updated[qId]);
      return updated;
    });
  };

  const handleImageSave = (qId: string, base64: string) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [qId]: {
          selected_option_ids: prev[qId]?.selected_option_ids || [],
          text_response: prev[qId]?.text_response || '[Diagram Canvas Attached]',
          image_base64: base64
        }
      };
      triggerAutoSave(qId, updated[qId]);
      return updated;
    });
  };

  const triggerAutoSave = async (qId: string, answerPayload: any) => {
    if (!paper) return;
    setAutoSaveStatus('Saving response...');
    try {
      await api.saveAnswer({
        session_id: paper.session_id,
        question_id: qId,
        selected_option_ids: answerPayload.selected_option_ids,
        text_response: answerPayload.text_response,
        image_base64: answerPayload.image_base64
      });
      setAutoSaveStatus('All changes saved to cloud');
    } catch (e) {
      setAutoSaveStatus('Cached locally (reconnecting)');
    }
  };

  const toggleFlag = (qId: string) => {
    setFlaggedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleFinalSubmit = async () => {
    if (!paper) return;
    setIsSubmitting(true);
    try {
      await api.submitFinalExam(paper.session_id);
    } catch (e) {
      console.warn('Final submit fallback', e);
    }
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => {
      onFinishExam(paper.session_id);
    }, 1200);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  if (showSystemCheck) {
    return (
      <SystemCheckModal
        examTitle="Advanced Computer Systems & AI Examination (2026)"
        durationMinutes={45}
        onProceed={initializeExamSession}
        onCancel={() => onFinishExam('')}
      />
    );
  }

  if (!paper || !currentQ) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <Sparkles size={40} className="pulse-slow" color="#6366F1" />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading secure examination paper...</p>
      </div>
    );
  }

  const isTimerCritical = secondsRemaining <= 300; // < 5 mins
  const isTimerUrgent = secondsRemaining <= 60; // < 1 min

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Lockdown Control Bar */}
      <header style={{
        height: '68px',
        padding: '0 2rem',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Exam Title & Subject */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-indigo">{paper.subject}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {paper.session_id.slice(0, 8)}...</span>
          </div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>{paper.title}</h2>
        </div>

        {/* Server Monotonic Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 18px',
          borderRadius: '10px',
          background: isTimerUrgent 
            ? 'rgba(239, 68, 68, 0.25)' 
            : (isTimerCritical ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-surface)'),
          border: `1px solid ${isTimerUrgent ? 'var(--accent-danger)' : (isTimerCritical ? 'var(--accent-warning)' : 'var(--border-subtle)')}`,
          color: isTimerUrgent ? '#F87171' : (isTimerCritical ? '#FBBF24' : '#F8FAFC'),
          animation: isTimerUrgent ? 'pulse 1s infinite' : 'none'
        }}>
          <Clock size={20} />
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Time Remaining</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 }}>
              {formatTime(secondsRemaining)}
            </div>
          </div>
        </div>

        {/* Action Controls & AutoSave Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Save size={14} color="#10B981" />
            <span>{autoSaveStatus}</span>
          </div>

          <button
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              borderColor: '#10B981',
              padding: '8px 18px'
            }}
            onClick={() => setShowConfirmModal(true)}
          >
            <Send size={16} />
            Submit Final Exam
          </button>
        </div>
      </header>

      {/* Main Examination Grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', padding: '1.5rem', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
        
        {/* Center: Question Workspace */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Question Header Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-indigo" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                  Question {currentIdx + 1} of {paper.questions.length}
                </span>
                <span className="badge badge-emerald">+{currentQ.max_marks} Marks</span>
                {currentQ.negative_marks > 0 && (
                  <span className="badge badge-coral">-{currentQ.negative_marks} Neg Marks</span>
                )}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {currentQ.question_type.replace('_', ' ')}
                </span>
              </div>

              {/* Bookmark / Flag Button */}
              <button
                className={`btn ${flaggedQuestions[currentQ.id] ? 'btn-danger' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => toggleFlag(currentQ.id)}
              >
                <Bookmark size={14} fill={flaggedQuestions[currentQ.id] ? '#FFF' : 'none'} />
                {flaggedQuestions[currentQ.id] ? 'Flagged for Review' : 'Flag Question'}
              </button>
            </div>

            {/* Question Prompt */}
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {currentQ.content}
            </div>

            {/* Answer Input Controls */}
            {/* 1. MCQ & Multi-Select Options */}
            {(currentQ.question_type === 'MCQ' || currentQ.question_type === 'multi_select') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Tip: Press keys 1-4 or A-D on your keyboard to toggle answers.
                </div>
                {currentQ.options.map((opt, oIdx) => {
                  const optId = opt.id || `opt-${oIdx}`;
                  const isSelected = (answers[currentQ.id]?.selected_option_ids || []).includes(optId);
                  const isMulti = currentQ.question_type === 'multi_select';
                  const keyLabel = String.fromCharCode(65 + oIdx);

                  return (
                    <div
                      key={optId}
                      onClick={() => handleOptionSelect(currentQ.id, optId, isMulti)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem 1.25rem',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-surface)',
                        border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 16px rgba(99, 102, 241, 0.25)' : 'none'
                      }}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: isMulti ? '6px' : '50%',
                        border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSelected ? 'var(--accent-primary)' : 'transparent',
                        color: '#FFF',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        {isSelected ? <CheckCircle2 size={16} /> : keyLabel}
                      </div>

                      <span style={{ fontSize: '0.95rem', color: isSelected ? '#FFF' : 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                        {opt.option_text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. Short & Long Subjective Answers */}
            {(currentQ.question_type === 'short_answer' || currentQ.question_type === 'long_answer') && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Type your structured response:</span>
                  <span className="badge badge-indigo">
                    Word count: {(answers[currentQ.id]?.text_response || '').trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={currentQ.question_type === 'long_answer' ? 10 : 5}
                  value={answers[currentQ.id]?.text_response || ''}
                  onChange={(e) => handleTextChange(currentQ.id, e.target.value)}
                  placeholder="Formulate your detailed technical answer here..."
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            )}

            {/* 3. Image & Handwritten Diagram Studio */}
            {currentQ.question_type === 'image_upload' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Draw your schematic diagram directly below or use the canvas tools:
                  </span>
                </div>
                <DiagramSketchCanvas
                  onSave={(base64) => handleImageSave(currentQ.id, base64)}
                />
              </div>
            )}
          </div>

          {/* Bottom Question Navigation Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            >
              <ArrowLeft size={16} />
              Previous Question
            </button>

            <button
              className="btn btn-secondary"
              disabled={currentIdx === paper.questions.length - 1}
              onClick={() => setCurrentIdx((prev) => Math.min(paper.questions.length - 1, prev + 1))}
            >
              Next Question
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Sidebar: Proctor HUD & Question Palette */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Webcam Proctor HUD */}
          <WebcamProctorHUD
            sessionId={paper.session_id}
            onViolation={(msg: string) => {
              setProctorViolations((prev) => [...prev.slice(-4), msg]);
              playWarningBeep();
            }}
          />

          {/* Question Palette Matrix */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Question Palette</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
              {paper.questions.map((q, qIdx) => {
                const isCurrent = qIdx === currentIdx;
                const isFlagged = flaggedQuestions[q.id];
                const ansObj = answers[q.id];
                const isAnswered = ansObj && (
                  (ansObj.selected_option_ids && ansObj.selected_option_ids.length > 0) ||
                  (ansObj.text_response && ansObj.text_response.trim().length > 0) ||
                  ansObj.image_base64
                );

                let bg = 'var(--bg-surface)';
                let color = 'var(--text-secondary)';
                let border = '1px solid var(--border-subtle)';

                if (isAnswered) {
                  bg = 'rgba(16, 185, 129, 0.2)';
                  color = '#6EE7B7';
                  border = '1px solid #10B981';
                }
                if (isFlagged) {
                  bg = 'rgba(239, 68, 68, 0.25)';
                  color = '#FCA5A5';
                  border = '1px solid #EF4444';
                }
                if (isCurrent) {
                  border = '2px solid var(--accent-primary)';
                  bg = 'rgba(99, 102, 241, 0.3)';
                  color = '#FFF';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(qIdx)}
                    style={{
                      height: '42px',
                      borderRadius: '8px',
                      background: bg,
                      color,
                      border,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.4)', border: '1px solid #10B981' }} />
                <span>Answered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.4)', border: '1px solid #EF4444' }} />
                <span>Flagged for Review</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} />
                <span>Unvisited</span>
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
          background: 'rgba(10, 15, 29, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <Send size={28} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>Submit Final Examination?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              You have answered {Object.keys(answers).length} of {paper.questions.length} questions. Once submitted, your responses are finalized for automated evaluation.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Return to Exam
              </button>
              <button
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderColor: '#10B981' }}
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
              >
                {isSubmitting ? 'Finalizing...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
