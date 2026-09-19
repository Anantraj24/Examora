import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  Sparkles, Shield, CheckCircle2, AlertCircle, ArrowRight, 
  Download, Plus, Filter, BookOpen, Layers, Trash2, Edit3, X, Loader2, BarChart2
} from 'lucide-react';
import { User, Exam } from '../types';
import { api } from '../services/api';

interface ScheduleCalendarViewProps {
  currentUser: User;
  onStartExam: (examId: string) => void;
  onViewResults?: (sessionId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

interface ProcessedScheduledItem {
  id: string;
  examId: string;
  title: string;
  subject: string;
  code: string;
  date: string;
  time: string;
  dayDate: number;
  duration: string;
  status: 'active' | 'upcoming' | 'upcoming_today' | 'completed' | 'in_progress' | 'expired';
  type: string;
  examiner: string;
  proctoring: string;
  room: string;
  totalMarks: number;
  rawSessionId?: string;
  rawStart?: string;
  rawEnd?: string;
  rawDurationMinutes: number;
  rawInstructions?: string;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  currentUser,
  onStartExam,
  onViewResults,
  onNavigateTab
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  
  // Date calculation for week strip
  const today = new Date();
  const currentMonthStr = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const [currentMonth, setCurrentMonth] = useState(currentMonthStr);

  // Modal State for Scheduling / Rescheduling
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalSubject, setModalSubject] = useState<string>('Computer Science');
  const [modalInstructions, setModalInstructions] = useState<string>('');
  const [modalDuration, setModalDuration] = useState<number>(60);
  const [modalStartWindow, setModalStartWindow] = useState<string>('');
  const [modalEndWindow, setModalEndWindow] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch exams from single source of truth
  const loadExams = async () => {
    setIsLoading(true);
    try {
      const data = await api.getExams(currentUser.role === 'student');
      if (data && data.length > 0) {
        setExams(data);
      } else {
        setExams([]);
      }
    } catch (err) {
      console.warn('Schedule exams fetch fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
    // Multi-view real-time sync listener
    const handleSync = () => {
      loadExams();
    };
    window.addEventListener('examora_exams_updated', handleSync);
    return () => {
      window.removeEventListener('examora_exams_updated', handleSync);
    };
  }, [currentUser.role]);

  // Generate dynamic 7-day week view based on current week
  const getWeekDays = () => {
    const current = new Date();
    const firstDayOfWeek = new Date(current);
    const dayIndex = current.getDay(); // 0 is Sun, 1 is Mon
    const diff = (dayIndex === 0 ? -6 : 1) - dayIndex; // Adjust to start on Monday
    firstDayOfWeek.setDate(current.getDate() + diff);

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDayOfWeek);
      d.setDate(firstDayOfWeek.getDate() + i);
      const dayNum = d.getDate();
      const isCurrentDay = d.toDateString() === current.toDateString();
      
      // Check if any exam falls on this day
      const hasEvents = exams.some(ex => {
        if (!ex.start_window) return isCurrentDay;
        const exDate = new Date(ex.start_window);
        return exDate.getDate() === dayNum && exDate.getMonth() === d.getMonth();
      });

      days.push({
        day: dayNames[i],
        date: dayNum,
        fullDate: d,
        hasEvents,
        isToday: isCurrentDay
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Helper to format ISO dates safely in local timezone without date shifts
  const parseExamSchedule = (exam: Exam): ProcessedScheduledItem => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (exam.start_window) {
      startDate = new Date(exam.start_window);
    } else {
      startDate = new Date();
    }

    if (exam.end_window) {
      endDate = new Date(exam.end_window);
    } else {
      endDate = new Date(startDate.getTime() + (exam.duration_minutes || 60) * 60 * 1000);
    }

    const isToday = startDate.toDateString() === now.toDateString();
    const isPast = endDate < now;
    const isWithinWindow = now >= startDate && now <= endDate;

    let status: 'active' | 'upcoming' | 'upcoming_today' | 'completed' | 'in_progress' | 'expired';
    if (currentUser.role === 'student') {
      if (exam.is_completed || exam.student_session_status === 'submitted') {
        status = 'completed';
      } else if (exam.student_session_status === 'in_progress') {
        status = 'in_progress';
      } else if (isPast) {
        status = 'expired';
      } else if (isWithinWindow || (isToday && exam.is_published)) {
        status = 'active';
      } else if (isToday) {
        status = 'upcoming_today';
      } else {
        status = 'upcoming';
      }
    } else {
      if (isPast) {
        status = 'completed';
      } else if (isWithinWindow || (isToday && exam.is_published)) {
        status = 'active';
      } else if (isToday) {
        status = 'upcoming_today';
      } else {
        status = 'upcoming';
      }
    }

    const dateStr = startDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const timeStart = startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const timeEnd = endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const timeStr = `${timeStart} - ${timeEnd}`;

    // Proctoring description
    const cfg = exam.proctoring_config;
    let proctoringDesc = 'Standard Verification';
    if (cfg?.webcam_required && cfg?.gaze_tracking) {
      proctoringDesc = 'AI Full Proctoring (MediaPipe Edge ML)';
    } else if (cfg?.webcam_required) {
      proctoringDesc = 'Camera & Identity Monitoring';
    } else if (cfg?.max_tab_switches) {
      proctoringDesc = 'Tab & Focus Tracking';
    }

    return {
      id: `sched-${exam.id}`,
      examId: exam.id,
      title: exam.title,
      subject: exam.subject,
      code: exam.subject.substring(0, 4).toUpperCase() + '101',
      date: dateStr,
      time: timeStr,
      dayDate: startDate.getDate(),
      duration: `${exam.duration_minutes} mins`,
      status,
      type: exam.is_published ? 'Formal Proctored Exam' : 'Draft Assessment',
      examiner: 'Exam Department / Faculty',
      proctoring: proctoringDesc,
      room: 'Virtual Room A-1',
      totalMarks: exam.total_marks || 100,
      rawSessionId: exam.student_session_id,
      rawStart: exam.start_window,
      rawEnd: exam.end_window,
      rawDurationMinutes: exam.duration_minutes,
      rawInstructions: exam.instructions
    };
  };

  // Convert raw exams to processed scheduled items
  const scheduledItems: ProcessedScheduledItem[] = exams.map(parseExamSchedule);

  // Filter items
  const filteredItems = scheduledItems.filter(item => {
    if (selectedFilter === 'today') {
      return item.dayDate === today.getDate();
    }
    if (selectedFilter === 'upcoming') {
      return item.status === 'upcoming' || item.status === 'upcoming_today';
    }
    if (selectedFilter === 'completed') {
      return item.status === 'completed' || item.status === 'expired';
    }
    return true;
 // all
  });

  // Calendar .ics download generated from actual synchronized exams
  const handleExportCalendar = () => {
    if (scheduledItems.length === 0) {
      alert('No scheduled exams available to export.');
      return;
    }

    const formatIcsDate = (dateObj: Date) => {
      return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let icsEvents = '';
    scheduledItems.forEach(item => {
      const startD = item.rawStart ? new Date(item.rawStart) : new Date();
      const endD = item.rawEnd ? new Date(item.rawEnd) : new Date(startD.getTime() + item.rawDurationMinutes * 60000);
      
      icsEvents += `BEGIN:VEVENT\nSUMMARY:${item.title}\nDESCRIPTION:${item.subject} (${item.duration}) - ${item.proctoring}\\nRoom: ${item.room}\nDTSTART:${formatIcsDate(startD)}\nDTEND:${formatIcsDate(endD)}\nUID:${item.examId}@examora.io\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });

    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Examora Intelligent Examination Platform//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n${icsEvents}END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'examora_schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open modal for creating a new exam schedule
  const handleOpenCreateModal = () => {
    setEditingExamId(null);
    setModalTitle('');
    setModalSubject('Computer Science');
    setModalInstructions('Proctored examination. Web camera, audio, and browser focus enforced.');
    setModalDuration(60);

    // Default start window: today at next hour
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const endHour = new Date(nextHour.getTime() + 60 * 60 * 1000);

    // Format for datetime-local (YYYY-MM-DDTHH:mm)
    const toLocalISO = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    setModalStartWindow(toLocalISO(nextHour));
    setModalEndWindow(toLocalISO(endHour));
    setActionError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing/rescheduling an existing exam
  const handleOpenEditModal = (item: ProcessedScheduledItem) => {
    setEditingExamId(item.examId);
    setModalTitle(item.title);
    setModalSubject(item.subject);
    setModalInstructions(item.rawInstructions || '');
    setModalDuration(item.rawDurationMinutes);

    const toLocalISO = (isoStr?: string, defaultDate = new Date()) => {
      const d = isoStr ? new Date(isoStr) : defaultDate;
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    setModalStartWindow(toLocalISO(item.rawStart));
    setModalEndWindow(toLocalISO(item.rawEnd, new Date(Date.now() + item.rawDurationMinutes * 60000)));
    setActionError(null);
    setIsModalOpen(true);
  };

  // Submit Schedule Modal (Create or Reschedule)
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    try {
      const startISO = modalStartWindow ? new Date(modalStartWindow).toISOString() : undefined;
      const endISO = modalEndWindow ? new Date(modalEndWindow).toISOString() : undefined;

      if (startISO && endISO && new Date(startISO) >= new Date(endISO)) {
        throw new Error('End schedule window must be after the start schedule window.');
      }

      if (editingExamId) {
        // Update / Reschedule existing exam
        await api.updateExam(editingExamId, {
          title: modalTitle,
          subject: modalSubject,
          instructions: modalInstructions,
          duration_minutes: modalDuration,
          start_window: startISO,
          end_window: endISO,
        });
      } else {
        // Create new scheduled exam
        await api.createExam({
          title: modalTitle,
          subject: modalSubject,
          instructions: modalInstructions,
          duration_minutes: modalDuration,
          start_window: startISO,
          end_window: endISO,
          is_published: true,
          blueprint_rules: { easy_count: 3, medium_count: 4, hard_count: 1 },
          proctoring_config: {
            webcam_required: true,
            gaze_tracking: true,
            multi_face_detection: true,
            max_tab_switches: 3
          }
        });
      }

      // Close modal and broadcast update to all tabs/components
      setIsModalOpen(false);
      window.dispatchEvent(new CustomEvent('examora_exams_updated'));
      await loadExams();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save exam schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete / Cancel Exam
  const handleDeleteExam = async (examId: string, title: string) => {
    const confirmed = window.confirm(`Are you sure you want to cancel and delete "${title}"? Stale schedule data will be removed from all views.`);
    if (!confirmed) return;

    try {
      await api.deleteExam(examId);
      window.dispatchEvent(new CustomEvent('examora_exams_updated'));
      await loadExams();
    } catch (err: any) {
      alert(`Failed to delete exam: ${err.message || 'Error occurred'}`);
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* 1. Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              Academic & Examination Schedule
            </h2>
            <span style={{
              fontSize: '0.72rem',
              padding: '3px 9px',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818CF8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontWeight: 700
            }}>
              Live Synchronized
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#94A3B8', marginTop: '4px', margin: 0 }}>
            Unified schedule source of truth. Synchronized across candidate portals, examiner desks, and assessments.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportCalendar}
            className="btn btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            <span>Export to Calendar (.ics)</span>
          </button>

          {currentUser.role !== 'student' && (
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-primary"
              style={{
                padding: '8px 14px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={15} />
              <span>Schedule New Exam</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Date & Week Strip */}
      <div className="dash-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366F1, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <CalendarIcon size={16} />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 800 }}>
              {currentMonth}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="dash-icon-btn" 
              onClick={() => {
                const prev = new Date();
                prev.setMonth(prev.getMonth() - 1);
                setCurrentMonth(prev.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }));
              }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="dash-icon-btn" 
              onClick={() => {
                const nxt = new Date();
                nxt.setMonth(nxt.getMonth() + 1);
                setCurrentMonth(nxt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }));
              }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 7 Days of Week Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '10px'
        }}>
          {weekDays.map((d) => {
            const isSelected = selectedDate === d.date;
            return (
              <div
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px 6px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  background: isSelected 
                    ? 'linear-gradient(135deg, #3B5EDB 0%, #4F46E5 100%)' 
                    : d.isToday
                    ? 'rgba(99, 102, 241, 0.12)'
                    : 'transparent',
                  border: isSelected 
                    ? '1px solid #4F46E5' 
                    : d.isToday
                    ? '1px solid rgba(99, 102, 241, 0.4)'
                    : '1px solid transparent',
                  color: isSelected ? '#FFFFFF' : 'inherit',
                  transition: 'all 0.18s ease'
                }}
              >
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  opacity: isSelected ? 0.9 : 0.6
                }}>
                  {d.day}
                </span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginTop: '4px',
                  lineHeight: 1
                }}>
                  {d.date}
                </span>
                
                {/* Event Dot Indicator */}
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  marginTop: '6px',
                  background: isSelected 
                    ? '#67E8F9' 
                    : d.hasEvents 
                    ? '#3B5EDB' 
                    : 'transparent'
                }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Filters Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[
          { id: 'all', label: 'All Scheduled' },
          { id: 'today', label: `Today (${today.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})` },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedFilter(f.id as typeof selectedFilter)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: selectedFilter === f.id ? '1px solid #3B5EDB' : '1px solid var(--border-medium)',
              background: selectedFilter === f.id ? 'rgba(59, 94, 219, 0.15)' : 'transparent',
              color: selectedFilter === f.id ? '#3B5EDB' : 'inherit',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 4. Scheduled Exam Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          <div className="dash-card" style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
            <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 12px auto', color: '#3B5EDB' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Synchronizing examination schedules...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="dash-card" style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
            <CalendarIcon size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'inherit', margin: '0 0 6px 0' }}>
              No Examinations Match This Filter
            </h4>
            <p style={{ fontSize: '0.84rem', margin: 0 }}>
              {currentUser.role !== 'student' 
                ? 'Click "Schedule New Exam" above to add an examination to the calendar.' 
                : 'Check "All Scheduled" to browse other upcoming tests.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isActive = item.status === 'active';
            const isInProgress = item.status === 'in_progress';
            const isCompleted = item.status === 'completed';
            const isExpired = item.status === 'expired';

            return (
              <div
                key={item.id}
                className="dash-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.5rem',
                  borderLeft: isActive 
                    ? '4px solid #10B981' 
                    : isCompleted 
                    ? '4px solid #94A3B8' 
                    : '4px solid #3B5EDB',
                  transition: 'transform 0.15s ease'
                }}
              >
                {/* Left Details */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isActive 
                      ? 'rgba(16, 185, 129, 0.15)' 
                      : isCompleted
                      ? 'rgba(148, 163, 184, 0.15)'
                      : 'rgba(59, 94, 219, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? '#10B981' : isCompleted ? '#94A3B8' : '#3B5EDB',
                    flexShrink: 0
                  }}>
                    {isActive ? <Sparkles size={20} /> : <BookOpen size={20} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(59, 94, 219, 0.1)',
                        color: '#3B5EDB',
                        textTransform: 'uppercase'
                      }}>
                        {item.code}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                        {item.title}
                      </h3>
                      {isActive && !isInProgress && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.4)'
                        }}>
                          ● READY TO LAUNCH
                        </span>
                      )}
                      {isInProgress && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#F59E0B',
                          border: '1px solid rgba(245, 158, 11, 0.4)'
                        }}>
                          ● IN PROGRESS
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          ✓ COMPLETED
                        </span>
                      )}
                      {isExpired && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          ● CLOSED
                        </span>
                      )}
                    </div>

                    {/* Metadata Row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '0.78rem',
                      color: '#94A3B8',
                      marginTop: '6px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon size={12} />
                        {item.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {item.time} ({item.duration})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={12} color="#06B6D4" />
                        {item.proctoring}
                      </span>
                      <span>Subject: <strong>{item.subject}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {currentUser.role !== 'student' && (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="btn btn-secondary"
                        style={{
                          padding: '8px 12px',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        title="Reschedule / Edit parameters"
                      >
                        <Edit3 size={13} />
                        <span>Reschedule</span>
                      </button>

                      <button
                        onClick={() => handleDeleteExam(item.examId, item.title)}
                        className="btn btn-secondary"
                        style={{
                          padding: '8px 10px',
                          fontSize: '0.78rem',
                          color: '#EF4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Cancel & Delete exam"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}

                  {isInProgress ? (
                    <button
                      onClick={() => onStartExam(item.examId)}
                      className="btn btn-primary"
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
                      }}
                    >
                      <span>Resume Exam</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : isActive ? (
                    <button
                      onClick={() => onStartExam(item.examId)}
                      className="btn btn-primary"
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                      }}
                    >
                      <span>Launch & Start Exam</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : isCompleted ? (
                    <button
                      onClick={() => {
                        if (currentUser.role === 'student') {
                          onViewResults && onViewResults(item.rawSessionId || item.examId);
                        } else {
                          onNavigateTab ? onNavigateTab('results') : (onViewResults && onViewResults(item.examId));
                        }
                      }}
                      className="btn btn-secondary"
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {currentUser.role === 'student' ? (
                        <>
                          <CheckCircle2 size={14} color="#10B981" />
                          <span>View Scorecard</span>
                        </>
                      ) : (
                        <>
                          <BarChart2 size={14} color="#6366F1" />
                          <span>Cohort Results</span>
                        </>
                      )}
                    </button>
                  ) : isExpired ? (
                    <span style={{
                      fontSize: '0.78rem',
                      color: '#EF4444',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                      Window Closed
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.78rem',
                      color: '#94A3B8',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      Opens at {item.time.split('-')[0].trim()}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Schedule / Reschedule Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="dash-card" style={{
            width: '100%',
            maxWidth: '560px',
            padding: '2rem',
            background: 'var(--bg-card, #1E293B)',
            borderRadius: '16px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'inherit' }}>
                  {editingExamId ? 'Reschedule Examination' : 'Schedule New Examination'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                  Configure start/end window timestamps with automatic timezone synchronization.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="dash-icon-btn"
                style={{ padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {actionError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                fontSize: '0.84rem',
                marginBottom: '1rem'
              }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', display: 'block', marginBottom: '5px' }}>
                  Exam Title
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'inherit',
                    fontSize: '0.88rem'
                  }}
                  placeholder="e.g. Distributed Systems Final"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', display: 'block', marginBottom: '5px' }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={modalSubject}
                    onChange={(e) => setModalSubject(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'inherit',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', display: 'block', marginBottom: '5px' }}>
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="360"
                    value={modalDuration}
                    onChange={(e) => setModalDuration(parseInt(e.target.value) || 60)}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'inherit',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', display: 'block', marginBottom: '5px' }}>
                    Start Schedule Window
                  </label>
                  <input
                    type="datetime-local"
                    value={modalStartWindow}
                    onChange={(e) => setModalStartWindow(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'inherit',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', display: 'block', marginBottom: '5px' }}>
                    End Schedule Window
                  </label>
                  <input
                    type="datetime-local"
                    value={modalEndWindow}
                    onChange={(e) => setModalEndWindow(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'inherit',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', display: 'block', marginBottom: '5px' }}>
                  Candidate Instructions
                </label>
                <input
                  type="text"
                  value={modalInstructions}
                  onChange={(e) => setModalInstructions(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'inherit',
                    fontSize: '0.85rem'
                  }}
                  placeholder="e.g. Strict proctoring. 3 tab switches maximum."
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                  <span>{editingExamId ? 'Save Rescheduled Window' : 'Confirm & Schedule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
