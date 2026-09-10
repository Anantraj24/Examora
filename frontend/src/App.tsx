import React, { useState, useEffect } from 'react';
import { DashboardLayout } from './components/DashboardLayout';
import { StudentDashboardView } from './components/StudentDashboardView';
import { ExamListView } from './components/ExamListView';
import { ExamSessionView } from './components/ExamSessionView';
import { ProctorMissionControl } from './components/ProctorMissionControl';
import { ExaminerGradingStudio } from './components/ExaminerGradingStudio';
import { StudentResultsView } from './components/StudentResultsView';
import { QuestionBankManager } from './components/QuestionBankManager';
import { ExamBuilderView } from './components/ExamBuilderView';
import { User, UserRole } from './types';
import { api } from './services/api';
import { BookOpen, Award, Sparkles, MessageSquare, Settings as SettingsIcon } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [resultSessionId, setResultSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-01',
    email: 'grace@examora.io',
    full_name: 'Grace Stanley',
    role: 'student',
    is_active: true
  });

  // Auto-login default role on mount
  useEffect(() => {
    api.autoLoginAsRole('student')
      .then((res) => {
        if (res?.user) setCurrentUser(res.user);
      })
      .catch((e) => console.warn('Auto-login on mount', e));
  }, []);

  // Health check to backend API
  useEffect(() => {
    async function checkBackend() {
      try {
        const resp = await fetch('http://localhost:8000/health');
        if (resp.ok) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (e) {
        setIsConnected(false);
      }
    }
    checkBackend();
    const interval = setInterval(checkBackend, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchRole = async (role: UserRole) => {
    try {
      const res = await api.autoLoginAsRole(role);
      if (res?.user) {
        setCurrentUser(res.user);
      }
    } catch (e) {
      console.warn('Role switch login error', e);
    }

    if (role === 'student') {
      setCurrentTab('dashboard');
    } else if (role === 'examiner') {
      setCurrentTab('grading');
    } else {
      setCurrentTab('proctor');
    }
  };

  const handleStartExam = (examId: string) => {
    setActiveSessionId(examId);
  };

  const handleFinishExam = (sessionId: string) => {
    setActiveSessionId(null);
    setResultSessionId(sessionId);
    setCurrentTab('results');
  };

  // If candidate is actively taking an examination, render full-screen proctored environment
  if (activeSessionId) {
    return (
      <ExamSessionView
        examId={activeSessionId}
        onFinishExam={handleFinishExam}
      />
    );
  }

  return (
    <DashboardLayout
      currentTab={currentTab}
      setCurrentTab={(tab) => {
        setActiveSessionId(null);
        setCurrentTab(tab);
      }}
      currentUser={currentUser}
      onSwitchRole={handleSwitchRole}
      isConnected={isConnected}
    >
      {/* 1. Main Student Dashboard (Exact 1:1 Reference Match) */}
      {currentTab === 'dashboard' && (
        <StudentDashboardView
          currentUser={currentUser}
          onNavigateTab={setCurrentTab}
          onStartExam={handleStartExam}
        />
      )}

      {/* 2. Lessons & Assessments (Exam List) */}
      {(currentTab === 'lessons' || currentTab === 'assessments' || currentTab === 'schedule') && (
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'inherit' }}>
                {currentTab === 'assessments' ? 'Formal Examinations & Assessments' : 'Scheduled Lessons & Mock Exams'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Select an active exam to launch pre-exam system check and AI proctoring verification.
              </p>
            </div>
            {currentUser.role !== 'student' && (
              <button 
                className="btn btn-primary"
                onClick={() => setCurrentTab('builder')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={16} /> Create New Exam Blueprint
              </button>
            )}
          </div>
          <ExamListView
            onStartExam={handleStartExam}
            onViewResults={(sessId) => {
              setResultSessionId(sessId);
              setCurrentTab('results');
            }}
          />
        </div>
      )}

      {/* 3. Candidate Scorecards & Analytics */}
      {currentTab === 'results' && (
        <StudentResultsView
          sessionId={resultSessionId || undefined}
          onBackToExams={() => setCurrentTab('dashboard')}
        />
      )}

      {/* 4. Examiner & Admin Portals */}
      {currentTab === 'grading' && (
        <div style={{ padding: '1.5rem' }}>
          <ExaminerGradingStudio />
        </div>
      )}
      {currentTab === 'proctor' && (
        <div style={{ padding: '1.5rem' }}>
          <ProctorMissionControl />
        </div>
      )}
      {currentTab === 'builder' && (
        <div style={{ padding: '1.5rem' }}>
          <ExamBuilderView onExamCreated={() => setCurrentTab('lessons')} />
        </div>
      )}
      {currentTab === 'questions' && (
        <div style={{ padding: '1.5rem' }}>
          <QuestionBankManager />
        </div>
      )}

      {/* 5. Supplemental Content Tabs (Materials, Forum, Settings) */}
      {currentTab === 'materials' && (
        <div style={{ padding: '2rem' }}>
          <div className="dash-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="#3B5EDB" /> Course Learning Materials & Reference Guides
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '1.5rem' }}>
              Access syllabus guidelines, algorithm cheat-sheets, and recommended readings.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {['Data Structures in C++', 'Operating Systems Architecture', 'Discrete Mathematics & Logic'].map((mat, i) => (
                <div key={i} style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{mat}</h4>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>PDF Handbook · 42 pages</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentTab === 'forum' && (
        <div style={{ padding: '2rem' }}>
          <div className="dash-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} color="#3B5EDB" /> Academic Discussion Forum
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '1.5rem' }}>
              Engage with mentors, teaching assistants, and classmates regarding course concepts and practice problems.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { title: 'Question regarding B-Tree median split criteria in order 3', author: 'Alex Mercer', replies: 4 },
                { title: 'Quorum consensus read/write overlapping proof discussion', author: 'Mary Johnson (mentor)', replies: 9 }
              ].map((post, i) => (
                <div key={i} style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{post.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Posted by {post.author}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#3B5EDB', fontWeight: 700 }}>{post.replies} replies</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentTab === 'settings' && (
        <div style={{ padding: '2rem' }}>
          <div className="dash-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingsIcon size={20} color="#3B5EDB" /> System & Hardware Readiness Settings
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '1.5rem' }}>
              Configure your webcam stream, audio input device, and browser display preferences before starting an exam.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700 }}>Webcam & MediaPipe Model</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Status: Ready (FaceMesh 468 landmarks loaded)</p>
              </div>
              <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700 }}>Monotonic Clock Sync</h4>
                <p style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>✓ Synchronized with Server Authority</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default App;
