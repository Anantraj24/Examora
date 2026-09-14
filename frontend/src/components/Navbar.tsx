import React from 'react';
import { 
  GraduationCap, Shield, User, Bot, BarChart2, 
  Layers, PlusCircle, CheckCircle2, Wifi, WifiOff, HelpCircle, LogOut
} from 'lucide-react';
import { UserRole, User as UserType } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: UserType | null;
  onSwitchRole: (role: UserRole) => void;
  isConnected: boolean;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onSwitchRole,
  isConnected,
  onLogout,
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

        {/* User Profile Pill & Sign Out */}
        {currentUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingLeft: '10px',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              color: '#FFFFFF'
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: currentUser.role === 'student' 
                  ? 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)' 
                  : currentUser.role === 'examiner' 
                  ? 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)' 
                  : 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: '#FFFFFF',
                boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)'
              }}>
                {currentUser.full_name?.charAt(0) || 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                  {currentUser.full_name?.split(' ')[0] || 'User'}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94A3B8', textTransform: 'capitalize' }}>
                  {currentUser.role}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#FCA5A5',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                title="Sign out of Examora"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
