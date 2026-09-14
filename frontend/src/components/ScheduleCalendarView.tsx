import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  Sparkles, Shield, CheckCircle2, AlertCircle, ArrowRight, 
  Download, Plus, Filter, BookOpen, Layers
} from 'lucide-react';
import { User, Exam } from '../types';
import { api } from '../services/api';

interface ScheduleCalendarViewProps {
  currentUser: User;
  onStartExam: (examId: string) => void;
  onViewResults?: (sessionId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  currentUser,
  onStartExam,
  onViewResults,
  onNavigateTab
}) => {
  const [selectedDate, setSelectedDate] = useState<number>(15); // Default to current day
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [currentMonth, setCurrentMonth] = useState('September 2026');

  // Days of current week
  const weekDays = [
    { day: 'Mon', date: 14, hasEvents: true, isToday: false },
    { day: 'Tue', date: 15, hasEvents: true, isToday: true },
    { day: 'Wed', date: 16, hasEvents: true, isToday: false },
    { day: 'Thu', date: 17, hasEvents: false, isToday: false },
    { day: 'Fri', date: 18, hasEvents: true, isToday: false },
    { day: 'Sat', date: 19, hasEvents: false, isToday: false },
    { day: 'Sun', date: 20, hasEvents: false, isToday: false },
  ];

  // Scheduled examination & lesson events
  const scheduledItems = [
    {
      id: 'sched-01',
      examId: 'exam-cs301',
      title: 'Algorithms & Advanced Data Structures Final',
      subject: 'Computer Science',
      code: 'CS301',
      date: 'Tuesday, Sep 15, 2026',
      time: '10:00 AM - 11:30 AM',
      dayDate: 15,
      duration: '90 mins',
      status: 'active', // active right now
      type: 'Formal Proctored Exam',
      examiner: 'Prof. Sarah Connor',
      proctoring: 'AI Full Proctoring (MediaPipe Edge ML)',
      room: 'Virtual Room A-1',
      totalMarks: 100,
    },
    {
      id: 'sched-02',
      examId: 'exam-os402',
      title: 'Operating Systems & Concurrency Mock Exam',
      subject: 'Computer Science',
      code: 'CS402',
      date: 'Tuesday, Sep 15, 2026',
      time: '02:00 PM - 03:00 PM',
      dayDate: 15,
      duration: '60 mins',
      status: 'upcoming_today',
      type: 'Mock Assessment',
      examiner: 'Dr. Marcus Vance',
      proctoring: 'Tab & Focus Tracking',
      room: 'Virtual Room B-4',
      totalMarks: 50,
    },
    {
      id: 'sched-03',
      examId: 'exam-db201',
      title: 'Relational Database Architecture & SQL Lab',
      subject: 'Information Systems',
      code: 'IS201',
      date: 'Wednesday, Sep 16, 2026',
      time: '11:00 AM - 12:30 PM',
      dayDate: 16,
      duration: '90 mins',
      status: 'upcoming',
      type: 'Midterm Assessment',
      examiner: 'Prof. Alan Vance',
      proctoring: 'Full Camera & Gaze Verification',
      room: 'Virtual Room C-2',
      totalMarks: 80,
    },
    {
      id: 'sched-04',
      examId: 'exam-math101',
      title: 'Discrete Mathematics & Boolean Logic Test',
      subject: 'Mathematics',
      code: 'MATH101',
      date: 'Friday, Sep 18, 2026',
      time: '09:30 AM - 11:00 AM',
      dayDate: 18,
      duration: '90 mins',
      status: 'upcoming',
      type: 'Formal Proctored Exam',
      examiner: 'Dr. Emily Chen',
      proctoring: 'AI Gaze & Landmark Verification',
      room: 'Virtual Room A-3',
      totalMarks: 100,
    },
    {
      id: 'sched-05',
      examId: 'exam-ai501',
      title: 'Introduction to Neural Networks & AI Ethics',
      subject: 'Artificial Intelligence',
      code: 'AI501',
      date: 'Monday, Sep 14, 2026',
      time: '10:00 AM - 11:15 AM',
      dayDate: 14,
      duration: '75 mins',
      status: 'completed',
      type: 'Quiz & Practical',
      examiner: 'Prof. Sarah Connor',
      proctoring: 'Full Camera Telemetry',
      room: 'Virtual Room D-1',
      totalMarks: 60,
    }
  ];

  // Filter items
  const filteredItems = scheduledItems.filter(item => {
    if (selectedFilter === 'today') return item.dayDate === 15;
    if (selectedFilter === 'upcoming') return item.dayDate >= 15 && item.status !== 'completed';
    if (selectedFilter === 'completed') return item.status === 'completed';
    return true; // all
  });

  // Calendar .ics download simulator
  const handleExportCalendar = () => {
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Smart Intelligent Examination Platform//EN\nBEGIN:VEVENT\nSUMMARY:Algorithms & Advanced Data Structures Final\nDESCRIPTION:Smart AI-Proctored Examination\\nRoom: Virtual Room A-1\nDTSTART:20260915T100000Z\nDTEND:20260915T113000Z\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'smart_schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              Semester Fall 2026
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#94A3B8', marginTop: '4px', margin: 0 }}>
            Track your official proctored test dates, mock tests, and submission windows.
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
              onClick={() => onNavigateTab && onNavigateTab('builder')}
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
              onClick={() => setCurrentMonth('August 2026')}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="dash-icon-btn"
              onClick={() => setCurrentMonth('October 2026')}
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
          { id: 'today', label: 'Today (Sep 15)' },
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
        {filteredItems.map((item) => {
          const isActive = item.status === 'active';
          const isCompleted = item.status === 'completed';

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
                    {isActive && (
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
                    <span>Examiner: <strong>{item.examiner}</strong></span>
                  </div>
                </div>
              </div>

              {/* Right Action Button */}
              <div>
                {isActive ? (
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
                    onClick={() => onViewResults && onViewResults(item.id)}
                    className="btn btn-secondary"
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={14} color="#10B981" />
                    <span>View Scorecard</span>
                  </button>
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
        })}
      </div>

    </div>
  );
};
