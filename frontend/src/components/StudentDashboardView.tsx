import React, { useState } from 'react';
import { 
  ChevronDown, MessageSquare, Phone, MoreVertical,
  BookOpen, Clock, Calendar as CalendarIcon, ArrowRight
} from 'lucide-react';
import { User } from '../types';

interface StudentDashboardViewProps {
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onStartExam?: (examId: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  currentUser,
  onNavigateTab,
  onStartExam
}) => {
  const [selectedMonth, setSelectedMonth] = useState('December');
  const [calendarFilter, setCalendarFilter] = useState('Today');

  // Performance data matching the reference image exactly
  const performanceData = [
    { value: 85.3, heightPercent: 85, topPercent: 20, label: 'Algorithms structures' },
    { value: 64.7, heightPercent: 65, topPercent: 25, label: 'Object program.' },
    { value: 84.2, heightPercent: 84, topPercent: 18, label: 'Database program.' },
    { value: 45.8, heightPercent: 46, topPercent: 30, label: 'Web develop.' },
    { value: 43.5, heightPercent: 44, topPercent: 28, label: 'Mobile application' },
    { value: 74.4, heightPercent: 74, topPercent: 22, label: 'Machine learning' },
  ];

  // My Visit 6 donut rings matching reference image
  const visitRings = [
    { percent: 92, label: 'Algorithms structures' },
    { percent: 83, label: 'Object program.' },
    { percent: 78, label: 'Database program.' },
    { percent: 97, label: 'Web develop.' },
    { percent: 96, label: 'Mobile application' },
    { percent: 89, label: 'Machine learning' },
  ];

  // Helper for Circular SVG Donut Ring
  const renderDonutRing = (percent: number, label: string, index: number) => {
    const size = 64;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px' }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E8EEF5"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#3B5EDB"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: '#1E293B'
          }}>
            {percent}%
          </div>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#64748B', maxWidth: '80px', lineHeight: 1.2, fontWeight: 500 }}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', width: '100%', maxWidth: '100%' }}>
      
      {/* =========================================================================
          LEFT / CENTER COLUMN (Hero Banner, Performance, My visit, Linked Teachers)
          ========================================================================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
        
        {/* 1. HERO WELCOME CARD */}
        <div className="dash-card" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '160px',
          background: '#FFFFFF'
        }}>
          <div style={{ maxWidth: '380px', zIndex: 2 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Hello Grace!
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.4, marginBottom: '0.75rem' }}>
              You have 3 new tasks. It is a lot of work for today! So let's start!
            </p>
            <button 
              onClick={() => onNavigateTab('lessons')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#3B5EDB',
                fontSize: '0.88rem',
                fontWeight: 700,
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              review it
            </button>
          </div>

          {/* 3D Student At Desk Image Asset */}
          <div style={{
            position: 'relative',
            width: '280px',
            height: '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="/assets/student_study_desk.jpg" 
              alt="Student study desk"
              style={{
                maxHeight: '150px',
                width: 'auto',
                objectFit: 'contain',
                borderRadius: '12px',
                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.08))'
              }}
            />
          </div>
        </div>

        {/* 2. PERFORMANCE & MY VISIT ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          
          {/* Performance Card */}
          <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1E293B' }}>Performance</h3>
              <div className="dash-pill-dropdown" onClick={() => setSelectedMonth(m => m === 'December' ? 'November' : 'December')}>
                <span>{selectedMonth}</span>
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Best Lesson Highlight Box */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #EEF2F6'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  The best lessons:
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E293B' }}>95.4</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.1, maxWidth: '100px' }}>Introduction to programming</span>
                </div>
              </div>
              <button 
                onClick={() => onNavigateTab('lessons')}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#1E293B',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                All lessons
              </button>
            </div>

            {/* Two-Tone Bar Chart */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              height: '150px',
              gap: '12px',
              paddingTop: '10px',
              borderBottom: '1px solid #F1F5F9'
            }}>
              {performanceData.map((item, idx) => (
                <div key={idx} className="bar-chart-column">
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>
                    {item.value}
                  </span>
                  <div className="bar-cylinder" style={{ height: `${item.heightPercent}px` }}>
                    <div className="bar-top" style={{ height: `${item.topPercent}%` }} />
                    <div className="bar-bottom" style={{ height: `${100 - item.topPercent}%` }} />
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    color: '#94A3B8',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* My visit Card */}
          <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1E293B' }}>My visit</h3>
              <div className="dash-pill-dropdown">
                <span>December</span>
                <ChevronDown size={14} />
              </div>
            </div>

            {/* 6 Circular Donut Rings Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem 0.5rem',
              marginTop: '0.5rem'
            }}>
              {visitRings.map((r, i) => renderDonutRing(r.percent, r.label, i))}
            </div>
          </div>
        </div>

        {/* 3. LINKED TEACHERS SECTION */}
        <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1E293B' }}>Linked Teachers</h3>
            <button style={{ background: 'transparent', border: 'none', color: '#3B5EDB', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              See all
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            {/* Teacher 1: Mary Johnson */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderRadius: '14px',
              background: '#F8FAFC',
              border: '1px solid #EEF2F6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F43F5E, #FB7185)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  MJ
                </div>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B' }}>
                    Mary Johnson <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>(mentor)</span>
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Science</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="dash-icon-btn" title="Send Message">
                  <MessageSquare size={16} />
                </button>
                <button className="dash-icon-btn" title="Audio Call">
                  <Phone size={16} />
                </button>
              </div>
            </div>

            {/* Teacher 2: James Brown */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderRadius: '14px',
              background: '#F8FAFC',
              border: '1px solid #EEF2F6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  JB
                </div>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B' }}>
                    James Brown
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Foreign language (Chinese)</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="dash-icon-btn" title="Send Message">
                  <MessageSquare size={16} />
                </button>
                <button className="dash-icon-btn" title="Audio Call">
                  <Phone size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          RIGHT COLUMN (Calendar Schedule Timeline & Upcoming Events)
          ========================================================================= */}
      <div style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0 }}>
        
        {/* 1. CALENDAR CARD */}
        <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1E293B' }}>Calendar</h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>6 events today</span>
            </div>
            <div className="dash-pill-dropdown">
              <span>{calendarFilter}</span>
              <ChevronDown size={14} />
            </div>
          </div>

          {/* Timeline View */}
          <div style={{ position: 'relative', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* 10:00 - Highlighted Active Card */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, width: '38px', paddingTop: '8px' }}>10:00</span>
              <div 
                onClick={() => onNavigateTab('lessons')}
                style={{
                  flex: 1,
                  background: '#3B5EDB',
                  color: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  boxShadow: '0 8px 16px -4px rgba(59, 94, 219, 0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Electronics lesson</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', opacity: 0.85, marginTop: '2px' }}>
                    <Clock size={11} />
                    <span>9.45 - 10.30, 21 lesson</span>
                  </div>
                </div>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* Current Time Dashed Marker Line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0 2px 42px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748B' }} />
              <div style={{ flex: 1, borderTop: '1px dashed #CBD5E1' }} />
            </div>

            {/* 11:00 / 11:30 - Schedule Item */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '38px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>11:00</span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>11:30</span>
              </div>
              <div style={{
                flex: 1,
                background: '#F1F5F9',
                borderRadius: '14px',
                padding: '10px 14px',
                border: '1px solid #E2E8F0'
              }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>Electronics lesson</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                  <Clock size={11} />
                  <span>11.00 - 11.40, 23 lesson</span>
                </div>
              </div>
            </div>

            {/* 12:00 / 12:30 - Schedule Item */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '38px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>12:00</span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>12:30</span>
              </div>
              <div style={{
                flex: 1,
                background: '#F1F5F9',
                borderRadius: '14px',
                padding: '10px 14px',
                border: '1px solid #E2E8F0'
              }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>Robotics lesson</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                  <Clock size={11} />
                  <span>12.00 - 12.45, 23 lesson</span>
                </div>
              </div>
            </div>

            {/* 13:00 / 13:30 - Schedule Item */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '38px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>13:00</span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>13:30</span>
              </div>
              <div style={{
                flex: 1,
                background: '#F1F5F9',
                borderRadius: '14px',
                padding: '10px 14px',
                border: '1px solid #E2E8F0'
              }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>C++ lesson</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                  <Clock size={11} />
                  <span>13.45 - 14.30, 21 lesson</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. UPCOMING EVENTS CARD */}
        <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1E293B' }}>Upcoming events</h3>
            <button style={{ background: 'transparent', border: 'none', color: '#3B5EDB', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              See all
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Event 1: Robot Fest */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 0',
              borderBottom: '1px solid #F1F5F9'
            }}>
              <img 
                src="/assets/robot_fest.jpg" 
                alt="Robot Fest"
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  The main event in your life "Robot Fest" will coming soon in...
                </h4>
                <p style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                  14 December 2023 · 12.00 pm
                </p>
              </div>
              <button className="dash-icon-btn">
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Event 2: Minecraft webinar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 0'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <BookOpen size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>
                  Webinar of new tools in Minecraft
                </h4>
                <p style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                  21 December 2023 · 11.00 pm
                </p>
              </div>
              <button className="dash-icon-btn">
                <MoreVertical size={16} />
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
