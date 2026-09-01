import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ExamListView } from './components/ExamListView';
import { ExamSessionView } from './components/ExamSessionView';
import { ProctorMissionControl } from './components/ProctorMissionControl';
import { ExaminerGradingStudio } from './components/ExaminerGradingStudio';
import { StudentResultsView } from './components/StudentResultsView';
import { QuestionBankManager } from './components/QuestionBankManager';
import { User, UserRole } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('exams');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [resultSessionId, setResultSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-01',
    email: 'alex@exam.io',
    full_name: 'Alex Mercer (Candidate)',
    role: 'student',
    is_active: true
  });

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
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchRole = (role: UserRole) => {
    if (role === 'student') {
      setCurrentUser({
        id: 'user-01',
        email: 'alex@exam.io',
        full_name: 'Alex Mercer (Candidate)',
        role: 'student',
        is_active: true
      });
      setCurrentTab('exams');
    } else if (role === 'examiner') {
      setCurrentUser({
        id: 'user-02',
        email: 'examiner@exam.io',
        full_name: 'Prof. Sarah Connor (Examiner)',
        role: 'examiner',
        is_active: true
      });
      setCurrentTab('grading');
    } else {
      setCurrentUser({
        id: 'user-03',
        email: 'admin@exam.io',
        full_name: 'Dr. Alan Vance (Admin)',
        role: 'admin',
        is_active: true
      });
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setActiveSessionId(null);
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        isConnected={isConnected}
      />

      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {currentTab === 'exams' && (
          activeSessionId ? (
            <ExamSessionView
              examId={activeSessionId}
              onFinishExam={handleFinishExam}
            />
          ) : (
            <ExamListView
              onStartExam={handleStartExam}
              onViewResults={(sessId) => {
                setResultSessionId(sessId);
                setCurrentTab('results');
              }}
            />
          )
        )}

        {currentTab === 'proctor' && <ProctorMissionControl />}
        {currentTab === 'grading' && <ExaminerGradingStudio />}
        {currentTab === 'results' && (
          <StudentResultsView
            sessionId={resultSessionId || undefined}
            onBackToExams={() => {
              setActiveSessionId(null);
              setCurrentTab('exams');
            }}
          />
        )}
        {currentTab === 'questions' && <QuestionBankManager />}
      </main>
    </div>
  );
};

export default App;
