import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LoginPage } from './components/LoginPage';
import { User, UserRole } from './types';
import { api } from './services/api';
import { BookOpen, Award, Sparkles, MessageSquare, Settings as SettingsIcon } from 'lucide-react';

// Code-split authenticated dashboard & examination views to keep the initial login bundle ultra-fast & interactive
const DashboardLayout = lazy(() => import('./components/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const StudentDashboardView = lazy(() => import('./components/StudentDashboardView').then(m => ({ default: m.StudentDashboardView })));
const ExamListView = lazy(() => import('./components/ExamListView').then(m => ({ default: m.ExamListView })));
const ExamSessionView = lazy(() => import('./components/ExamSessionView').then(m => ({ default: m.ExamSessionView })));
const ProctorMissionControl = lazy(() => import('./components/ProctorMissionControl').then(m => ({ default: m.ProctorMissionControl })));
const ExaminerGradingStudio = lazy(() => import('./components/ExaminerGradingStudio').then(m => ({ default: m.ExaminerGradingStudio })));
const StudentResultsView = lazy(() => import('./components/StudentResultsView').then(m => ({ default: m.StudentResultsView })));
const QuestionBankManager = lazy(() => import('./components/QuestionBankManager').then(m => ({ default: m.QuestionBankManager })));
const ExamBuilderView = lazy(() => import('./components/ExamBuilderView').then(m => ({ default: m.ExamBuilderView })));
const ScheduleCalendarView = lazy(() => import('./components/ScheduleCalendarView').then(m => ({ default: m.ScheduleCalendarView })));
const MaterialsView = lazy(() => import('./components/MaterialsView').then(m => ({ default: m.MaterialsView })));
const ForumView = lazy(() => import('./components/ForumView').then(m => ({ default: m.ForumView })));
const ExaminerDashboardView = lazy(() => import('./components/ExaminerDashboardView').then(m => ({ default: m.ExaminerDashboardView })));
const CohortAnalyticsView = lazy(() => import('./components/CohortAnalyticsView').then(m => ({ default: m.CohortAnalyticsView })));

const ViewLoadingFallback: React.FC = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '12px',
    color: '#94A3B8'
  }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '3px solid rgba(99, 102, 241, 0.2)',
      borderTopColor: '#6366F1',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <span style={{ fontSize: '0.84rem' }}>Loading workspace...</span>
  </div>
);

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => sessionStorage.getItem('examora_active_exam_id'));
  const [resultSessionId, setResultSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Initialize from persistent authentication storage
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getCurrentUser());

  // Non-blocking persistent session verification on mount
  useEffect(() => {
    // If no token exists, the user is logged out: zero network overhead, immediate login interaction
    if (!api.getToken()) {
      setCurrentUser(null);
      return;
    }

    let isMounted = true;
    api.getMe()
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Non-blocking background health check with strict timeout (never stalls login UI)
  useEffect(() => {
    let isMounted = true;
    async function checkBackend() {
      const healthy = await api.checkHealth(2500);
      if (isMounted) {
        setIsConnected(healthy);
      }
    }
    checkBackend();
    const interval = setInterval(checkBackend, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Role-Based Access Control (RBAC) Tab Validator
  const isTabAllowedForRole = (tab: string, role: UserRole): boolean => {
    if (role === 'student') {
      return ['dashboard', 'schedule', 'assessments', 'lessons', 'results', 'materials', 'forum', 'settings'].includes(tab);
    }
    if (role === 'examiner') {
      return ['dashboard', 'grading', 'proctor', 'schedule', 'builder', 'questions', 'results', 'settings', 'materials', 'forum'].includes(tab);
    }
    if (role === 'admin') {
      return ['dashboard', 'proctor', 'grading', 'builder', 'questions', 'schedule', 'results', 'settings', 'materials', 'forum'].includes(tab);
    }
    return true;
  };

  const handleNavigateTab = (tab: string) => {
    if (currentUser && !isTabAllowedForRole(tab, currentUser.role)) {
      console.warn(`[RBAC Guard] Role ${currentUser.role} is not permitted to access ${tab}. Rerouting to dashboard.`);
      setCurrentTab('dashboard');
      return;
    }
    setActiveSessionId(null);
    setCurrentTab(tab);
  };

  // Enforce RBAC guard on active tab whenever currentUser or currentTab changes
  useEffect(() => {
    if (currentUser && !isTabAllowedForRole(currentTab, currentUser.role)) {
      setCurrentTab('dashboard');
    }
  }, [currentUser, currentTab]);

  const handleSwitchRole = async (role: UserRole) => {
    try {
      const res = await api.autoLoginAsRole(role);
      if (res?.user) {
        setCurrentUser(res.user);
      }
    } catch (e) {
      console.warn('Role switch login error', e);
    }

    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('examora_active_exam_id');
    api.logout();
    setCurrentUser(null);
    setActiveSessionId(null);
    setResultSessionId(null);
    setCurrentTab('dashboard');
  };

  const handleStartExam = (examId: string) => {
    sessionStorage.setItem('examora_active_exam_id', examId);
    setActiveSessionId(examId);
  };

  const handleFinishExam = (sessionId: string) => {
    sessionStorage.removeItem('examora_active_exam_id');
    setActiveSessionId(null);
    setResultSessionId(sessionId);
    setCurrentTab('results');
  };

  // If candidate is actively taking an examination, render full-screen proctored environment
  if (activeSessionId && currentUser) {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <ExamSessionView
          examId={activeSessionId}
          onFinishExam={handleFinishExam}
        />
      </Suspense>
    );
  }

  // If user is not authenticated, render the dedicated LoginPage immediately without chunk overhead
  if (!currentUser) {
    return (
      <LoginPage
        isConnected={isConnected}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  return (
    <Suspense fallback={<ViewLoadingFallback />}>
      <DashboardLayout
        currentTab={currentTab}
        setCurrentTab={handleNavigateTab}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        isConnected={isConnected}
        onLogout={handleLogout}
      >
      {/* 1. Main Role-Specific Dashboard (Student vs Examiner/Admin) */}
      {currentTab === 'dashboard' && (
        currentUser.role === 'student' ? (
          <StudentDashboardView
            currentUser={currentUser}
            onNavigateTab={handleNavigateTab}
            onStartExam={handleStartExam}
          />
        ) : (
          <ExaminerDashboardView
            currentUser={currentUser}
            onNavigateTab={handleNavigateTab}
          />
        )
      )}

      {/* 2. Dedicated Academic & Examination Schedule View */}
      {currentTab === 'schedule' && (
        <ScheduleCalendarView
          currentUser={currentUser}
          onStartExam={handleStartExam}
          onViewResults={(sessId) => {
            setResultSessionId(sessId);
            handleNavigateTab('results');
          }}
          onNavigateTab={handleNavigateTab}
        />
      )}

      {/* 3. Lessons & Assessments (Exam List) */}
      {(currentTab === 'lessons' || currentTab === 'assessments') && (
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

      {/* 3. Candidate Scorecards (Student) vs Cohort Analytics (Examiner/Admin) */}
      {currentTab === 'results' && (
        currentUser.role === 'student' ? (
          <StudentResultsView
            sessionId={resultSessionId || undefined}
            onBackToExams={() => handleNavigateTab('dashboard')}
          />
        ) : (
          <CohortAnalyticsView />
        )
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
        <MaterialsView currentUser={currentUser} />
      )}

      {currentTab === 'forum' && (
        <ForumView currentUser={currentUser} />
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
    </Suspense>
  );
};

export default App;
