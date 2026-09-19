import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, CheckCircle, HelpCircle, FileText, 
  Layers, Sparkles, Filter, Check, Search, X, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { Question, QuestionType, DifficultyLevel } from '../types';

export const QuestionBankManager: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Question Form State
  const [qType, setQType] = useState<QuestionType>('MCQ');
  const [qSubject, setQSubject] = useState('Computer Science');
  const [qTopic, setQTopic] = useState('Operating Systems');
  const [qDifficulty, setQDifficulty] = useState<DifficultyLevel>('medium');
  const [qContent, setQContent] = useState('');
  const [qModelAnswer, setQModelAnswer] = useState('');
  const [qMaxMarks, setQMaxMarks] = useState(2.0);
  const [qNegMarks, setQNegMarks] = useState(0.5);
  const [options, setOptions] = useState([
    { option_text: '', is_correct: true, sort_order: 0 },
    { option_text: '', is_correct: false, sort_order: 1 },
    { option_text: '', is_correct: false, sort_order: 2 },
    { option_text: '', is_correct: false, sort_order: 3 },
  ]);
  const [rubrics, setRubrics] = useState([
    { criterion: 'Accurate technical definition', points: 1.0 },
    { criterion: 'Covers edge cases & trade-offs', points: 1.0 }
  ]);

  const loadQuestions = async (query = searchQuery, subject = subjectFilter, type = typeFilter, diff = difficultyFilter) => {
    setIsLoading(true);
    try {
      const data = await api.getQuestions({
        q: query || undefined,
        subject: subject || undefined,
        question_type: type || undefined,
        difficulty: diff || undefined,
      });
      setQuestions(data || []);
    } catch (e) {
      console.warn('Questions fetch fallback', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadQuestions(searchQuery, subjectFilter, typeFilter, difficultyFilter);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery, subjectFilter, typeFilter, difficultyFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSubjectFilter('');
    setTypeFilter('');
    setDifficultyFilter('');
  };

  const handleCreateQuestion = async () => {
    if (!qContent.trim()) {
      alert('Please enter question content');
      return;
    }

    try {
      await api.createQuestion({
        subject: qSubject,
        topic: qTopic,
        question_type: qType,
        difficulty: qDifficulty,
        content: qContent,
        model_answer: qModelAnswer,
        max_marks: qMaxMarks,
        negative_marks: qNegMarks,
        options: (qType === 'MCQ' || qType === 'multi_select') ? options : [],
        rubric_criteria: (qType === 'short_answer' || qType === 'long_answer' || qType === 'image_upload') ? rubrics : []
      });
      setIsModalOpen(false);
      loadQuestions();
      // Reset
      setQContent('');
      setQModelAnswer('');
    } catch (err: any) {
      alert(err.message || 'Error creating question');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={24} color="#6366F1" />
            Structured Question Bank Management
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Author and manage MCQs, Multi-Select, Short/Long subjective items with AI grading rubrics.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Create New Question
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            flex: '1 1 320px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search MCQs & questions by keyword, topic, concept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: searchQuery ? '36px' : '14px',
                height: '40px',
                fontSize: '0.875rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              style={{ height: '40px', minWidth: '180px', padding: '0 12px', borderRadius: '8px' }}
            >
              <option value="">All Subjects</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Data Structures">Data Structures</option>
              <option value="AI & ML">AI & Machine Learning</option>
            </select>
          </div>

          {/* Question Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ height: '40px', minWidth: '160px', padding: '0 12px', borderRadius: '8px' }}
            >
              <option value="">All Question Types</option>
              <option value="MCQ">Single Choice MCQ</option>
              <option value="multi_select">Multi-Select</option>
              <option value="short_answer">Short Written</option>
              <option value="long_answer">Long Written</option>
              <option value="image_upload">Diagram Upload</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              style={{ height: '40px', minWidth: '130px', padding: '0 12px', borderRadius: '8px' }}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Counter and Active Indicators */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLoading && (
              <Loader2 size={16} className="spin" color="#6366F1" />
            )}
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {questions.length} Questions
            </span>
            {(searchQuery || subjectFilter || typeFilter || difficultyFilter) && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && questions.length === 0 && (
        <div className="glass-panel" style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HelpCircle size={28} color="#818CF8" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No matching questions found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', lineHeight: 1.5 }}>
            {searchQuery || subjectFilter || typeFilter || difficultyFilter
              ? `No questions match your current query "${searchQuery || 'filters'}". Try broadening your search or resetting filters.`
              : 'The question repository is currently empty. Click "Create New Question" to add your first item.'}
          </p>
          {(searchQuery || subjectFilter || typeFilter || difficultyFilter) && (
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{ marginTop: '6px', fontSize: '0.85rem' }}
            >
              Clear Search & Filters
            </button>
          )}
        </div>
      )}

      {/* Questions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
        {questions.map((q, idx) => (
          <div key={q.id || idx} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                  {q.question_type.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`badge ${q.difficulty === 'easy' ? 'badge-emerald' : (q.difficulty === 'medium' ? 'badge-amber' : 'badge-rose')}`} style={{ fontSize: '0.65rem' }}>
                  {q.difficulty}
                </span>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '0.75rem' }}>
                {q.content}
              </h4>

              {q.options && q.options.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.75rem' }}>
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      style={{
                        fontSize: '0.8rem',
                        padding: '4px 8px',
                        background: opt.is_correct ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
                        color: opt.is_correct ? '#6EE7B7' : 'var(--text-secondary)',
                        borderRadius: '4px',
                        border: `1px solid ${opt.is_correct ? 'rgba(16, 185, 129, 0.3)' : 'transparent'}`
                      }}
                    >
                      {opt.is_correct ? '✓ ' : '• '}{opt.option_text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              <span>{q.subject} {q.topic ? `• ${q.topic}` : ''}</span>
              <strong style={{ color: '#F8FAFC' }}>+{q.max_marks} pts</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Question Creation Modal */}
      {isModalOpen && (
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
          <div className="glass-panel" style={{ maxWidth: '650px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 800 }}>Create New Question</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Question Type</label>
                <select value={qType} onChange={(e) => setQType(e.target.value as QuestionType)}>
                  <option value="MCQ">Single Choice MCQ</option>
                  <option value="multi_select">Multi-Select Checkboxes</option>
                  <option value="short_answer">Short Written Answer</option>
                  <option value="long_answer">Long Written Answer</option>
                  <option value="image_upload">Handwritten Diagram / Sheet Upload</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Difficulty Level</label>
                <select value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value as DifficultyLevel)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Subject</label>
                <input value={qSubject} onChange={(e) => setQSubject(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Topic</label>
                <input value={qTopic} onChange={(e) => setQTopic(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Question Content</label>
              <textarea rows={3} value={qContent} onChange={(e) => setQContent(e.target.value)} placeholder="Type question description..." />
            </div>

            {/* MCQ Options Config */}
            {(qType === 'MCQ' || qType === 'multi_select') && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Options & Correct Answer Selection ({qType === 'MCQ' ? 'Pick 1 correct' : 'Check all correct'}):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type={qType === 'MCQ' ? 'radio' : 'checkbox'}
                        checked={opt.is_correct}
                        onChange={(e) => {
                          const updated = [...options];
                          if (qType === 'MCQ') {
                            updated.forEach((o, i) => { o.is_correct = i === idx; });
                          } else {
                            updated[idx].is_correct = e.target.checked;
                          }
                          setOptions(updated);
                        }}
                        style={{ width: '20px', cursor: 'pointer' }}
                      />
                      <input
                        placeholder={`Option ${idx + 1}`}
                        value={opt.option_text}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].option_text = e.target.value;
                          setOptions(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model Answer for Subjective */}
            {(qType === 'short_answer' || qType === 'long_answer' || qType === 'image_upload') && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Model Answer (For AI Rubric Comparison):
                </label>
                <textarea rows={3} value={qModelAnswer} onChange={(e) => setQModelAnswer(e.target.value)} placeholder="Ideal student response..." />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Max Marks</label>
                <input type="number" step="0.5" value={qMaxMarks} onChange={(e) => setQMaxMarks(parseFloat(e.target.value))} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Negative Marks Deduction</label>
                <input type="number" step="0.25" value={qNegMarks} onChange={(e) => setQNegMarks(parseFloat(e.target.value))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateQuestion}>
                Save Question to Bank
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
