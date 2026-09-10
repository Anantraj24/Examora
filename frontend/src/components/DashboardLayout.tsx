import React, { useState } from 'react';
import { 
  LayoutGrid, BookOpen, Calendar, FolderMinus, MessageSquare, 
  Award, Settings, LogOut, Search, ChevronDown, Mail, Bell, 
  Sun, Moon, Sparkles, Shield, UserCheck
} from 'lucide-react';
import { User, UserRole } from '../types';

interface DashboardLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
  isConnected: boolean;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onSwitchRole,
  isConnected,
  children
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Navigation Tabs
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'lessons', label: 'Lessons', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'materials', label: 'Materials', icon: FolderMinus },
    { id: 'forum', label: 'Forum', icon: MessageSquare },
    { id: 'assessments', label: 'Assessments', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div 
      className={`dash-board ${isDarkMode ? 'dark-mode' : ''}`}
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        maxWidth: '100%',
        margin: 0,
        padding: 0,
        borderRadius: 0,
        boxShadow: 'none',
        display: 'flex',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDarkMode ? '#0B1120' : '#F4F6FB'
      }}
    >
      {/* 1. DUAL-TIER LEFT SIDEBAR */}
      {/* 1A: Dock (Icons) */}
      <div className="dash-dock" style={{ height: '100vh' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <div
              key={item.id}
              className={`dash-dock-icon ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
              title={item.label}
            >
              <Icon size={20} />
            </div>
          );
        })}

        <div style={{ marginTop: 'auto' }}>
          <div 
            className="dash-dock-icon" 
            onClick={() => onSwitchRole('student')}
            title="Log Out"
          >
            <LogOut size={20} />
          </div>
        </div>
      </div>

      {/* 1B: Drawer (Labels & Logo) */}
      <div className="dash-drawer" style={{ height: '100vh' }}>
        {/* Brand Logo */}
        <div className="dash-drawer-logo">
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: '#FFFFFF',
            color: '#3B5EDB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '0.9rem'
          }}>
            ✿
          </div>
          <span>Smart</span>
        </div>

        {/* Navigation Items List with curved active cutout */}
        <nav className="dash-nav-list">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <div
                key={item.id}
                className={`dash-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentTab(item.id)}
              >
                {item.label}
              </div>
            );
          })}
        </nav>

        {/* Bottom Log Out */}
        <div style={{ marginTop: 'auto' }}>
          <div 
            className="dash-nav-item" 
            onClick={() => onSwitchRole('student')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.85 }}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        
        {/* TOP BAR */}
        <header className="dash-topbar" style={{ flexShrink: 0 }}>
          
          {/* Left: Title + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: isDarkMode ? '#FFFFFF' : '#1E293B' }}>
                Dashboard for student
              </h1>
              <span style={{
                fontSize: '0.68rem',
                background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isConnected ? '#10B981' : '#EF4444',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 700,
                border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {isConnected ? 'LIVE ENGINE' : 'OFFLINE'}
              </span>
            </div>

            {/* Search Input Box */}
            <div className="dash-search-box">
              <input 
                type="text" 
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.85rem',
                  outline: 'none',
                  color: isDarkMode ? '#FFFFFF' : '#1E293B',
                  boxShadow: 'none'
                }}
              />
              <Search size={15} color="#94A3B8" />
            </div>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            
            {/* Theme Toggle Pill */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                background: isDarkMode ? '#1E293B' : '#FFFFFF',
                border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: isDarkMode ? '#F8FAFC' : '#3B5EDB',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              {isDarkMode ? <Moon size={13} color="#818CF8" /> : <Sun size={13} color="#F59E0B" />}
              <span>{isDarkMode ? 'Dark mode' : 'Light mode'}</span>
            </button>

            {/* Language Selector */}
            <div className="dash-pill-dropdown">
              <span>ENG</span>
              <ChevronDown size={14} />
            </div>

            {/* Message / Mail icon */}
            <div className="dash-icon-btn" title="Messages">
              <Mail size={18} />
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#3B82F6'
              }} />
            </div>

            {/* Notification Bell */}
            <div className="dash-icon-btn" title="Notifications">
              <Bell size={18} />
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#EF4444'
              }} />
            </div>

            {/* User Profile Chip & Role Selector */}
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '9999px',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  GS
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isDarkMode ? '#FFFFFF' : '#1E293B' }}>
                    Grace Stanley
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#3B5EDB', fontWeight: 600, textTransform: 'uppercase' }}>
                    {currentUser.role}
                  </span>
                </div>

                <ChevronDown size={14} color="#94A3B8" />
              </div>

              {/* Role Switcher Menu */}
              {showRoleDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: '200px',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: '14px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                  border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
                  padding: '8px',
                  zIndex: 50
                }}>
                  <div style={{ padding: '6px 10px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Switch Role Portal
                  </div>
                  
                  <button
                    onClick={() => { onSwitchRole('student'); setShowRoleDropdown(false); setCurrentTab('dashboard'); }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: currentUser.role === 'student' ? 'rgba(59, 94, 219, 0.1)' : 'transparent',
                      color: currentUser.role === 'student' ? '#3B5EDB' : (isDarkMode ? '#F8FAFC' : '#1E293B'),
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <UserCheck size={14} /> Student (Grace Stanley)
                  </button>

                  <button
                    onClick={() => { onSwitchRole('examiner'); setShowRoleDropdown(false); setCurrentTab('grading'); }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: currentUser.role === 'examiner' ? 'rgba(59, 94, 219, 0.1)' : 'transparent',
                      color: currentUser.role === 'examiner' ? '#3B5EDB' : (isDarkMode ? '#F8FAFC' : '#1E293B'),
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Shield size={14} /> Examiner (Prof. Connor)
                  </button>

                  <button
                    onClick={() => { onSwitchRole('admin'); setShowRoleDropdown(false); setCurrentTab('proctor'); }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: currentUser.role === 'admin' ? 'rgba(59, 94, 219, 0.1)' : 'transparent',
                      color: currentUser.role === 'admin' ? '#3B5EDB' : (isDarkMode ? '#F8FAFC' : '#1E293B'),
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Sparkles size={14} /> Admin / Proctor Lead
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* PAGE CONTENT CONTAINER (Edge-to-Edge Full Height Scrolling) */}
        <main style={{ flex: 1, overflowY: 'auto', width: '100%' }}>
          {children}
        </main>

      </div>

    </div>
  );
};
