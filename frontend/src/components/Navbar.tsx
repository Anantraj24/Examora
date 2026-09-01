import React from 'react';
import { 
  GraduationCap, Shield, User, Bot, BarChart2, 
  Layers, PlusCircle, CheckCircle2, Wifi, WifiOff, HelpCircle
} from 'lucide-react';
import { UserRole, User as UserType } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: UserType | null;
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
      height: '70px',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Brand Logo */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => setCurrentTab('exams')}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
        }}>
          <Shield size={22} color="#FFFFFF" />
        </div>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Examora<span style={{ color: 'var(--accent-secondary)' }}>.ai</span>
          </span>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '-2px' }}>
            Enterprise Proctor Engine
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          className={`btn ${currentTab === 'exams' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('exams')}
        >
          <GraduationCap size={16} />
          Student Exams
        </button>

        <button
          className={`btn ${currentTab === 'proctor' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('proctor')}
        >
          <Shield size={16} />
          Live Proctoring
        </button>

        <button
          className={`btn ${currentTab === 'grading' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('grading')}
        >
          <Bot size={16} />
          Examiner Studio
        </button>

        <button
          className={`btn ${currentTab === 'results' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('results')}
        >
          <BarChart2 size={16} />
          Scorecard & Analytics
        </button>

        <button
          className={`btn ${currentTab === 'builder' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('builder')}
        >
          <Layers size={16} />
          Exam Builder
        </button>

        <button
          className={`btn ${currentTab === 'questions' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('questions')}
        >
          <PlusCircle size={16} />
          Question Bank
        </button>
      </nav>

      {/* Role Switcher & Live Connection Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        
        {/* Backend Heartbeat Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '20px',
          background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontSize: '0.75rem',
          color: isConnected ? '#6EE7B7' : '#FCA5A5'
        }}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isConnected ? 'Backend Active' : 'Offline'}</span>
        </div>

        {/* Role Toggle Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-surface)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => onSwitchRole('student')}
            style={{
              padding: '5px 10px',
              borderRadius: '7px',
              border: 'none',
              background: currentUser?.role === 'student' ? 'var(--accent-primary)' : 'transparent',
              color: currentUser?.role === 'student' ? '#FFF' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Candidate
          </button>

          <button
            type="button"
            onClick={() => onSwitchRole('examiner')}
            style={{
              padding: '5px 10px',
              borderRadius: '7px',
              border: 'none',
              background: currentUser?.role === 'examiner' ? 'var(--accent-primary)' : 'transparent',
              color: currentUser?.role === 'examiner' ? '#FFF' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Examiner
          </button>

          <button
            type="button"
            onClick={() => onSwitchRole('admin')}
            style={{
              padding: '5px 10px',
              borderRadius: '7px',
              border: 'none',
              background: currentUser?.role === 'admin' ? 'var(--accent-primary)' : 'transparent',
              color: currentUser?.role === 'admin' ? '#FFF' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Admin
          </button>
        </div>
      </div>
    </header>
  );
};
