import React from 'react';
import { 
  ShieldCheck, BrainCircuit, GraduationCap, Users, 
  FileText, CheckCircle2, Radio, Sparkles
} from 'lucide-react';
import { User, UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  onSwitchRole: (role: UserRole) => void;
  isConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onSwitchRole,
  isConnected,
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setCurrentTab('exams')}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
        }}>
          <BrainCircuit size={24} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AegisExam AI
            </span>
            <span className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>v1.0 Pro</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Intelligent Examination & Proctoring Platform
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${currentTab === 'exams' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setCurrentTab('exams')}
        >
          <GraduationCap size={16} />
          Student Exam
        </button>

        <button
          className={`btn ${currentTab === 'proctor' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setCurrentTab('proctor')}
        >
          <Radio size={16} color={currentTab === 'proctor' ? '#FFFFFF' : '#EF4444'} />
          Live Proctoring
        </button>

        <button
          className={`btn ${currentTab === 'grading' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setCurrentTab('grading')}
        >
          <Sparkles size={16} color={currentTab === 'grading' ? '#FFFFFF' : '#F59E0B'} />
          Examiner Studio
        </button>

        <button
          className={`btn ${currentTab === 'results' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setCurrentTab('results')}
        >
          <CheckCircle2 size={16} />
          Scorecard & Analytics
        </button>

        <button
          className={`btn ${currentTab === 'questions' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setCurrentTab('questions')}
        >
          <FileText size={16} />
          Question Bank
        </button>
      </nav>

      {/* User & Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Backend Live Ping */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: 'var(--bg-surface)',
          borderRadius: '9999px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#10B981' : '#EF4444',
            boxShadow: isConnected ? '0 0 8px #10B981' : '0 0 8px #EF4444'
          }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            {isConnected ? 'Core Engine: Online' : 'Connecting...'}
          </span>
        </div>

        {/* Role Quick Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => onSwitchRole('student')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: currentUser?.role === 'student' ? 'var(--accent-primary)' : 'transparent',
              color: currentUser?.role === 'student' ? '#FFF' : 'var(--text-muted)'
            }}
          >
            Student
          </button>
          <button
            onClick={() => onSwitchRole('examiner')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: currentUser?.role === 'examiner' ? 'var(--accent-primary)' : 'transparent',
              color: currentUser?.role === 'examiner' ? '#FFF' : 'var(--text-muted)'
            }}
          >
            Examiner
          </button>
          <button
            onClick={() => onSwitchRole('admin')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: currentUser?.role === 'admin' ? 'var(--accent-primary)' : 'transparent',
              color: currentUser?.role === 'admin' ? '#FFF' : 'var(--text-muted)'
            }}
          >
            Admin
          </button>
        </div>
      </div>
    </header>
  );
};
