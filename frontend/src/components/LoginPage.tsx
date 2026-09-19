import React, { useState, Suspense, lazy } from 'react';
import { 
  Shield, Lock, Mail, User as UserIcon, ArrowRight, 
  CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, 
  GraduationCap, Bot, UserCheck, Gamepad2, Wifi, WifiOff, Loader2
} from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

// Lazy-load the cyber security game & canvas-confetti bundle so login renders instantly
const CyberAuthGame = lazy(() => import('./CyberAuthGame').then(m => ({ default: m.CyberAuthGame })));

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  isConnected: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, isConnected }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'game'>('signin');
  const [email, setEmail] = useState<string>('alex@examora.io');
  const [password, setPassword] = useState<string>('student123');
  const [fullName, setFullName] = useState<string>('Alex Mercer');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Security Game Verification Gate Modal State (default false for frictionless, instant login)
  const [showVerificationGate, setShowVerificationGate] = useState<boolean>(false);
  const [requireSecurityGame, setRequireSecurityGame] = useState<boolean>(false);

  // Quick 1-Click Demo Profiles
  const demoProfiles = [
    {
      role: 'student' as UserRole,
      title: 'Candidate',
      name: 'Alex Mercer',
      email: 'alex@examora.io',
      password: 'student123',
      icon: GraduationCap,
      color: '#06B6D4',
      badge: 'Test Taker'
    },
    {
      role: 'examiner' as UserRole,
      title: 'Examiner',
      name: 'Prof. Sarah Connor',
      email: 'examiner@examora.io',
      password: 'examiner123',
      icon: Bot,
      color: '#818CF8',
      badge: 'Grading Studio'
    },
    {
      role: 'admin' as UserRole,
      title: 'Administrator',
      name: 'Dr. Alan Vance',
      email: 'admin@examora.io',
      password: 'admin123',
      icon: UserCheck,
      color: '#F59E0B',
      badge: 'System Admin'
    }
  ];

  // Execute actual API login
  const executeLogin = async (targetEmail: string, targetPass: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.login(targetEmail, targetPass);
      setSuccessMessage(`Welcome back, ${response.user.full_name}!`);
      setTimeout(() => {
        onLoginSuccess(response.user);
      }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  // Handle Sign In Submit
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    if (requireSecurityGame) {
      // Trigger Neural Verification Gate
      setShowVerificationGate(true);
    } else {
      executeLogin(email, password);
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setErrorMessage('Please fill in all registration fields');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.register({
        email,
        password,
        full_name: fullName,
        role
      });
      setSuccessMessage(`Account created successfully! Welcome, ${response.user.full_name}.`);
      setTimeout(() => {
        onLoginSuccess(response.user);
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  // 1-Click Instant Demo Login
  const handleQuickDemo = async (profile: typeof demoProfiles[0]) => {
    setEmail(profile.email);
    setPassword(profile.password);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.login(profile.email, profile.password);
      setSuccessMessage(`Logged in as ${response.user.full_name} (${profile.title})`);
      setTimeout(() => {
        onLoginSuccess(response.user);
      }, 350);
    } catch {
      // Fallback: auto-login role if server has cold-start
      try {
        const res = await api.autoLoginAsRole(profile.role);
        setSuccessMessage(`Logged in as ${res.user.full_name}`);
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 350);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Login failed';
        setErrorMessage(msg);
        setIsLoading(false);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #1E1B4B 0%, #0F172A 50%, #0B0F19 100%)',
      color: '#FFFFFF',
      padding: '2rem 1rem',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Ambient background glow & grid elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '15%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none'
      }} />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            boxShadow: '0 0 35px rgba(99, 102, 241, 0.5)',
            marginBottom: '1rem'
          }}>
            <Shield size={34} color="#FFFFFF" />
          </div>

          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 0.4rem 0'
          }}>
            Examora<span style={{ color: '#38BDF8' }}>.ai</span>
          </h1>
          <p style={{
            color: '#94A3B8',
            fontSize: '0.88rem',
            margin: 0,
            maxWidth: '420px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.4
          }}>
            AI-Proctored Intelligent Examination Platform. Log in with your credentials or create a new account to get started.
          </p>

          {/* Backend Status Indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '0.75rem',
            padding: '3px 10px',
            borderRadius: '20px',
            background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: '0.72rem',
            color: isConnected ? '#6EE7B7' : '#FCA5A5'
          }}>
            {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
            <span>{isConnected ? 'FastAPI Gateway Online' : 'Offline / Standalone Mode'}</span>
          </div>
        </div>

        {/* Card Frame */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.12)',
          overflow: 'hidden'
        }}>

          {/* Navigation Mode Switcher */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1.1fr',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(11, 17, 32, 0.6)'
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
              style={{
                padding: '14px 10px',
                border: 'none',
                background: activeTab === 'signin' ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                borderBottom: activeTab === 'signin' ? '2px solid #6366F1' : '2px solid transparent',
                color: activeTab === 'signin' ? '#FFFFFF' : '#94A3B8',
                fontWeight: activeTab === 'signin' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.18s'
              }}
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
              style={{
                padding: '14px 10px',
                border: 'none',
                background: activeTab === 'register' ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                borderBottom: activeTab === 'register' ? '2px solid #6366F1' : '2px solid transparent',
                color: activeTab === 'register' ? '#FFFFFF' : '#94A3B8',
                fontWeight: activeTab === 'register' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.18s'
              }}
            >
              Create Account
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('game'); setErrorMessage(null); }}
              style={{
                padding: '14px 10px',
                border: 'none',
                background: activeTab === 'game' ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
                borderBottom: activeTab === 'game' ? '2px solid #06B6D4' : '2px solid transparent',
                color: activeTab === 'game' ? '#67E8F9' : '#94A3B8',
                fontWeight: activeTab === 'game' ? 700 : 500,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.18s'
              }}
            >
              <Gamepad2 size={15} />
              <span>Mini-Game</span>
            </button>
          </div>

          <div style={{ padding: '2rem' }}>

            {/* Contextual Guidance Banner */}
            {activeTab === 'signin' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                fontSize: '0.78rem',
                color: '#CBD5E1',
                marginBottom: '1.25rem'
              }}>
                <span>Have an account? Log in below.</span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38BDF8',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    textDecoration: 'underline'
                  }}
                >
                  Need to create an account?
                </button>
              </div>
            )}

            {activeTab === 'register' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: '0.78rem',
                color: '#CBD5E1',
                marginBottom: '1.25rem'
              }}>
                <span>New here? Fill in your details to create an account.</span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#818CF8',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    textDecoration: 'underline'
                  }}
                >
                  Already registered? Log in
                </button>
              </div>
            )}

            {/* Error Notification */}
            {errorMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#FCA5A5',
                fontSize: '0.82rem',
                marginBottom: '1.25rem'
              }}>
                <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#6EE7B7',
                fontSize: '0.82rem',
                marginBottom: '1.25rem'
              }}>
                <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {/* Email Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    Institutional / Candidate Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@examora.io"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '0.88rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    Security Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 42px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '0.88rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Neural Pattern Verification Checkbox */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <input
                    type="checkbox"
                    id="requireSecurityGame"
                    checked={requireSecurityGame}
                    onChange={(e) => setRequireSecurityGame(e.target.checked)}
                    style={{ accentColor: '#6366F1', cursor: 'pointer' }}
                  />
                  <label htmlFor="requireSecurityGame" style={{ fontSize: '0.78rem', color: '#CBD5E1', cursor: 'pointer', userSelect: 'none' }}>
                    Require Neural Pattern Verification (Game Gate)
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: isLoading ? 'wait' : 'pointer',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.2s',
                    marginTop: '0.5rem'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In with Credentials</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* Switch to Register footer link */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '0.75rem',
                  fontSize: '0.84rem',
                  color: '#94A3B8'
                }}>
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38BDF8',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.84rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Create an account
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                
                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    Full Legal Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    Institutional Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.m@institution.edu"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    Set Password (min 6 characters)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 42px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    Select Institutional Role
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { value: 'student' as UserRole, label: 'Candidate' },
                      { value: 'examiner' as UserRole, label: 'Examiner' },
                      { value: 'admin' as UserRole, label: 'Admin' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setRole(item.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: role === item.value ? '2px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: role === item.value ? 'rgba(99, 102, 241, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                          color: role === item.value ? '#FFFFFF' : '#94A3B8',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: isLoading ? 'wait' : 'pointer',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                    marginTop: '0.5rem'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Register Account</span>
                      <CheckCircle2 size={16} />
                    </>
                  )}
                </button>

                {/* Switch to Sign In footer link */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '0.75rem',
                  fontSize: '0.84rem',
                  color: '#94A3B8'
                }}>
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#818CF8',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.84rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Log In here
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: STANDALONE ARCADE GAME */}
            {activeTab === 'game' && (
              <div>
                <Suspense fallback={
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '10px', color: '#94A3B8' }}>
                    <Loader2 size={24} className="animate-spin" color="#06B6D4" />
                    <span style={{ fontSize: '0.82rem' }}>Initializing Cyber Engine...</span>
                  </div>
                }>
                  <CyberAuthGame
                    isVerificationGate={false}
                    onVerified={() => {
                      setSuccessMessage('High Score Synced! You have proven high cognitive readiness.');
                    }}
                  />
                </Suspense>
              </div>
            )}

            {/* 1-Click Demo Credentials Quick-Access Bar */}
            {activeTab !== 'game' && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    1-Click Instant Demo Profiles
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                    Zero-typing login
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {demoProfiles.map((profile) => {
                    const IconComponent = profile.icon;
                    return (
                      <button
                        key={profile.role}
                        type="button"
                        onClick={() => handleQuickDemo(profile)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          background: 'rgba(30, 41, 59, 0.45)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          textAlign: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = profile.color;
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.45)';
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: `${profile.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: profile.color
                        }}>
                          <IconComponent size={15} />
                        </div>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#E2E8F0' }}>
                          {profile.title}
                        </span>
                        <span style={{ fontSize: '0.62rem', color: '#94A3B8' }}>
                          {profile.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.72rem', color: '#64748B' }}>
          Examora Security Engine • End-to-End Encrypted Session Verification • Python FastAPI & React
        </div>

      </div>

      {/* NEURAL GAME VERIFICATION GATE MODAL */}
      {showVerificationGate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(7, 10, 20, 0.88)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <Suspense fallback={
              <div style={{ padding: '2.5rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', color: '#94A3B8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Loader2 size={28} className="animate-spin" color="#6366F1" />
                <span style={{ fontSize: '0.85rem' }}>Loading Neural Verification Gate...</span>
              </div>
            }>
              <CyberAuthGame
                isVerificationGate={true}
                onVerified={() => {
                  setShowVerificationGate(false);
                  executeLogin(email, password);
                }}
                onBypass={() => {
                  setShowVerificationGate(false);
                  executeLogin(email, password);
                }}
              />
            </Suspense>
          </div>
        </div>
      )}

    </div>
  );
};
