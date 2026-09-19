import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutGrid, BookOpen, Calendar, FolderMinus, MessageSquare, 
  Award, Settings, LogOut, Search, ChevronDown, Mail, Bell, 
  Sun, Moon, Sparkles, Shield, UserCheck, Bot, Layers, PlusCircle, BarChart2,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Menu, CheckCircle2,
  X, Loader2, Check, ExternalLink, HelpCircle, FileText
} from 'lucide-react';
import { User, UserRole, Exam, Question, CourseMaterial, ForumPost, AppNotification } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';

interface DashboardLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
  isConnected: boolean;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onSwitchRole,
  isConnected,
  onLogout,
  children
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Live Search Overlay State
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    exams: Exam[];
    questions: Question[];
    materials: CourseMaterial[];
    forum: ForumPost[];
  }>({ exams: [], questions: [], materials: [], forum: [] });
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Inbox & Notification Dropdown State
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showInboxDropdown, setShowInboxDropdown] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [messages, setMessages] = useState([
    {
      id: 'msg-01',
      sender: 'AI Proctoring Lead',
      subject: 'Proctoring Sensor Calibration',
      snippet: 'Webcam telemetry stream and facial keypoint trackers verified for your session.',
      time: '15m ago',
      is_read: false,
      target_route: 'proctor'
    },
    {
      id: 'msg-02',
      sender: 'Examiner Sarah Connor',
      subject: 'Rubric Criteria Updated',
      snippet: 'B-Tree Order 3 insertion rubric verified with node split and child pointer checks.',
      time: '1h ago',
      is_read: false,
      target_route: 'questions'
    },
    {
      id: 'msg-03',
      sender: 'Academic Admin',
      subject: 'Exam Blueprint Published',
      snippet: 'Distributed Systems & Cloud Architecture Final has been published to schedule.',
      time: '4h ago',
      is_read: true,
      target_route: 'assessments'
    }
  ]);
  const unreadMsgCount = messages.filter(m => !m.is_read).length;

  const { currentLanguage, currentOption, setLanguage, supportedLanguages, t } = useTranslation();

  // Load Notifications
  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res && res.items) {
        setNotifications(res.items);
        setUnreadNotifCount(res.unread_count);
      }
    } catch (e) {
      console.warn('Notifications fetch fallback', e);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  // Live Multi-Domain Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ exams: [], questions: [], materials: [], forum: [] });
      setIsSearching(false);
      setShowSearchDropdown(false);
      return;
    }

    setShowSearchDropdown(true);
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const q = searchQuery.trim();
        const [examsRes, questionsRes, materialsRes, forumRes] = await Promise.allSettled([
          api.getExams(),
          api.getQuestions({ q }),
          api.getMaterials({ q }),
          api.getForumPosts({ q, page_size: 4 })
        ]);

        const exams = examsRes.status === 'fulfilled'
          ? (examsRes.value || []).filter(e => 
              e.title.toLowerCase().includes(q.toLowerCase()) || 
              e.subject.toLowerCase().includes(q.toLowerCase())
            ).slice(0, 3)
          : [];

        const questions = questionsRes.status === 'fulfilled'
          ? (questionsRes.value || []).slice(0, 3)
          : [];

        const materials = materialsRes.status === 'fulfilled'
          ? (materialsRes.value || []).slice(0, 3)
          : [];

        const forum = forumRes.status === 'fulfilled'
          ? (forumRes.value?.items || []).slice(0, 3)
          : [];

        setSearchResults({ exams, questions, materials, forum });
      } catch (err) {
        console.warn('Live search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle clicking outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notification Click with Read Tracking & Dynamic Navigation
  const handleNotificationClick = async (notif: AppNotification) => {
    try {
      if (!notif.is_read) {
        await api.markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadNotifCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.warn('Notification mark read error', e);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    }

    setShowNotificationDropdown(false);

    if (notif.target_route) {
      const allowedTabs = getNavItems().map(item => item.id);
      if (allowedTabs.includes(notif.target_route)) {
        setCurrentTab(notif.target_route);
      } else {
        // Fallback for role cross-compatibility
        if (currentUser.role === 'examiner' && notif.target_route === 'assessments') {
          setCurrentTab('builder');
        } else if (currentUser.role === 'student' && notif.target_route === 'grading') {
          setCurrentTab('results');
        } else if (currentUser.role === 'student' && notif.target_route === 'questions') {
          setCurrentTab('materials');
        }
      }
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
    } catch (e) {
      console.warn('Mark all read error', e);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadNotifCount(0);
  };

  const handleMessageClick = (msgId: string, route?: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_read: true } : m));
    setShowInboxDropdown(false);
    if (route) {
      const allowedTabs = getNavItems().map(item => item.id);
      if (allowedTabs.includes(route)) {
        setCurrentTab(route);
      }
    }
  };


  // Role-Aware Navigation Tabs for seamless sidebar switching
  const getNavItems = () => {
    if (currentUser.role === 'examiner') {
      return [
        { id: 'dashboard', label: t('nav.dashboard', 'Overview & Studio'), icon: LayoutGrid },
        { id: 'grading', label: t('nav.grading', 'Grading Studio'), icon: Bot },
        { id: 'proctor', label: t('nav.proctor', 'Live Proctoring'), icon: Shield },
        { id: 'schedule', label: t('nav.schedule', 'Master Schedule'), icon: Calendar },
        { id: 'builder', label: t('nav.builder', 'Exam Builder'), icon: Layers },
        { id: 'questions', label: t('nav.questions', 'Question Bank'), icon: PlusCircle },
        { id: 'results', label: t('nav.results', 'Cohort Analytics'), icon: BarChart2 },
        { id: 'settings', label: t('nav.settings', 'Settings'), icon: Settings },
      ];
    }
    if (currentUser.role === 'admin') {
      return [
        { id: 'dashboard', label: t('nav.dashboard', 'Mission Control'), icon: LayoutGrid },
        { id: 'proctor', label: t('nav.proctor', 'Live Proctoring'), icon: Shield },
        { id: 'grading', label: t('nav.grading', 'Evaluations'), icon: Bot },
        { id: 'builder', label: t('nav.builder', 'Blueprint Builder'), icon: Layers },
        { id: 'questions', label: t('nav.questions', 'Question Bank'), icon: PlusCircle },
        { id: 'schedule', label: t('nav.schedule', 'Master Schedule'), icon: Calendar },
        { id: 'results', label: t('nav.results', 'Cohort Analytics'), icon: BarChart2 },
        { id: 'settings', label: t('nav.settings', 'System Settings'), icon: Settings },
      ];
    }
    // Default: Student / Candidate
    return [
      { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutGrid },
      { id: 'schedule', label: t('nav.schedule', 'Schedule'), icon: Calendar },
      { id: 'assessments', label: t('nav.assessments', 'Exams & Tests'), icon: Award },
      { id: 'results', label: t('nav.scorecard', 'My Scorecard'), icon: BarChart2 },
      { id: 'materials', label: t('nav.materials', 'Materials'), icon: FolderMinus },
      { id: 'forum', label: t('nav.forum', 'Forum'), icon: MessageSquare },
      { id: 'settings', label: t('nav.settings', 'Settings'), icon: Settings },
    ];
  };

  const navItems = getNavItems();

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
      <div className={`dash-dock ${!isSidebarOpen ? 'drawer-collapsed' : ''}`} style={{ height: '100vh' }}>
        {/* Toggle Bar Button */}
        <div 
          className="dash-dock-toggle-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Close bar" : "Open bar"}
        >
          {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </div>

        {/* Floating edge handle when collapsed */}
        {!isSidebarOpen && (
          <div
            className="dash-edge-toggle-handle"
            onClick={() => setIsSidebarOpen(true)}
            title="Open bar"
          >
            <ChevronRight size={13} />
          </div>
        )}

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
            onClick={() => onLogout ? onLogout() : onSwitchRole('student')}
            title="Log Out"
            style={{ cursor: 'pointer' }}
          >
            <LogOut size={20} />
          </div>
        </div>
      </div>

      {/* 1B: Drawer (Labels & Logo) */}
      <div className={`dash-drawer ${!isSidebarOpen ? 'collapsed' : ''}`} style={{ height: '100vh' }}>
        {/* Floating edge handle when open */}
        {isSidebarOpen && (
          <div
            className="dash-edge-toggle-handle"
            onClick={() => setIsSidebarOpen(false)}
            title="Close bar"
          >
            <ChevronLeft size={13} />
          </div>
        )}

        {/* Brand Logo & Close Bar Button */}
        <div className="dash-drawer-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <span>Examora</span>
          </div>

          <button
            type="button"
            className="dash-drawer-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            title="Close bar"
          >
            <ChevronLeft size={16} />
          </button>
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
            onClick={() => onLogout ? onLogout() : onSwitchRole('student')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.85, cursor: 'pointer' }}
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
          
          {/* Left: Toggle Bar + Title + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <button
              type="button"
              className="dash-bar-toggle-header"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Close bar" : "Open bar"}
            >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: isDarkMode ? '#FFFFFF' : '#1E293B' }}>
                {currentUser.role === 'examiner'
                  ? 'Examiner Studio Workspace'
                  : currentUser.role === 'admin'
                  ? 'Administrator Mission Control'
                  : 'Student Candidate Portal'}
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

            {/* Search Input Box with Realtime Results Overlay */}
            <div ref={searchContainerRef} style={{ position: 'relative' }}>
              <div className="dash-search-box" style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder={t('topbar.search', 'Search examinations, lessons, question banks...')}
                  value={searchQuery}
                  onFocus={() => { if (searchQuery.trim()) setShowSearchDropdown(true); }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '0 24px 0 0',
                    fontSize: '0.85rem',
                    outline: 'none',
                    color: isDarkMode ? '#FFFFFF' : '#1E293B',
                    boxShadow: 'none'
                  }}
                />
                {isSearching ? (
                  <Loader2 size={14} className="spin" color="#6366F1" />
                ) : searchQuery ? (
                  <button 
                    type="button"
                    onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={14} color="#94A3B8" />
                  </button>
                ) : (
                  <Search size={15} color="#94A3B8" />
                )}
              </div>

              {/* Realtime Search Results Popover */}
              {showSearchDropdown && searchQuery.trim() && (
                <div 
                  className="dash-card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '420px',
                    maxHeight: '480px',
                    overflowY: 'auto',
                    padding: '12px',
                    borderRadius: '14px',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    zIndex: 1100,
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Universal Search Results
                    </span>
                    <button 
                      onClick={() => setShowSearchDropdown(false)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Questions & MCQs Matches */}
                  {searchResults.questions.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818CF8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <PlusCircle size={13} />
                        Question Bank & MCQs ({searchResults.questions.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {searchResults.questions.map(q => (
                          <div 
                            key={q.id}
                            onClick={() => {
                              setCurrentTab('questions');
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: 'var(--bg-surface)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                              {q.content}
                            </div>
                            <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                              {q.question_type.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Examinations Matches */}
                  {searchResults.exams.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Award size={13} />
                        Examinations ({searchResults.exams.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {searchResults.exams.map(ex => (
                          <div 
                            key={ex.id}
                            onClick={() => {
                              setCurrentTab(currentUser.role === 'examiner' ? 'builder' : 'assessments');
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: 'var(--bg-surface)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', fontWeight: 600 }}>
                              {ex.title}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {ex.duration_minutes}m
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Course Materials Matches */}
                  {searchResults.materials.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F59E0B', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FolderMinus size={13} />
                        Course Materials ({searchResults.materials.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {searchResults.materials.map(mat => (
                          <div 
                            key={mat.id}
                            onClick={() => {
                              setCurrentTab('materials');
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: 'var(--bg-surface)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                              {mat.title}
                            </div>
                            <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                              {mat.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Forum Discussions Matches */}
                  {searchResults.forum.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#06B6D4', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MessageSquare size={13} />
                        Forum Discussions ({searchResults.forum.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {searchResults.forum.map(f => (
                          <div 
                            key={f.id}
                            onClick={() => {
                              setCurrentTab('forum');
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: 'var(--bg-surface)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                              {f.title}
                            </div>
                            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                              {f.tag}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!isSearching && 
                   searchResults.questions.length === 0 && 
                   searchResults.exams.length === 0 && 
                   searchResults.materials.length === 0 && 
                   searchResults.forum.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)' }}>
                      <HelpCircle size={24} style={{ margin: '0 auto 6px auto', opacity: 0.6 }} />
                      <div style={{ fontSize: '0.85rem' }}>No results found for "{searchQuery}"</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Try searching another keyword or question topic.</div>
                    </div>
                  )}
                </div>
              )}
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
            <div style={{ position: 'relative' }}>
              <div 
                className="dash-pill-dropdown"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Change display language"
              >
                <span>{currentOption.flag}</span>
                <span style={{ fontWeight: 700 }}>{currentOption.shortCode}</span>
                <ChevronDown size={14} />
              </div>

              {showLanguageDropdown && (
                <div 
                  className="dash-card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '180px',
                    padding: '6px',
                    borderRadius: '12px',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    background: isDarkMode ? '#1E293B' : '#FFFFFF'
                  }}
                >
                  {supportedLanguages.map((lang) => {
                    const isSelected = lang.code === currentLanguage;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLanguageDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isSelected ? 'rgba(59, 94, 219, 0.15)' : 'transparent',
                          color: isSelected ? '#3B5EDB' : isDarkMode ? '#F8FAFC' : '#1E293B',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          fontSize: '0.84rem',
                          textAlign: 'left',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                        {isSelected && <CheckCircle2 size={13} color="#3B5EDB" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message / Mail icon */}
            <div style={{ position: 'relative' }}>
              <div 
                className="dash-icon-btn" 
                title="Messages & Communication Inbox"
                onClick={() => {
                  setShowInboxDropdown(!showInboxDropdown);
                  setShowNotificationDropdown(false);
                  setShowLanguageDropdown(false);
                  setShowRoleDropdown(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                <Mail size={18} />
                {unreadMsgCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    minWidth: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3B82F6'
                  }} />
                )}
              </div>

              {showInboxDropdown && (
                <div 
                  className="dash-card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    padding: '12px',
                    borderRadius: '14px',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    zIndex: 1000,
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} color="#3B82F6" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Inbox & Messages</span>
                    </div>
                    {unreadMsgCount > 0 && (
                      <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                        {unreadMsgCount} new
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        onClick={() => handleMessageClick(msg.id, msg.target_route)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: msg.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.08)',
                          border: `1px solid ${msg.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.2)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: msg.is_read ? 'var(--text-secondary)' : '#3B82F6' }}>
                            {msg.sender}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{msg.time}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{msg.subject}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {msg.snippet}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <div 
                className="dash-icon-btn" 
                title="Notifications"
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  setShowInboxDropdown(false);
                  setShowLanguageDropdown(false);
                  setShowRoleDropdown(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    minWidth: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#EF4444'
                  }} />
                )}
              </div>

              {showNotificationDropdown && (
                <div 
                  className="dash-card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '340px',
                    padding: '12px',
                    borderRadius: '14px',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    zIndex: 1000,
                    background: isDarkMode ? '#1E293B' : '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bell size={14} color="#EF4444" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Notifications</span>
                      {unreadNotifCount > 0 && (
                        <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                          {unreadNotifCount}
                        </span>
                      )}
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#6366F1',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                            border: `1px solid ${n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.2)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: n.is_read ? 'var(--text-secondary)' : '#6366F1' }}>
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366F1' }} />
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {n.message}
                          </div>
                          {n.target_route && (
                            <div style={{ fontSize: '0.68rem', color: '#818CF8', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                              <span>Navigate to {n.target_route}</span>
                              <ExternalLink size={10} />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
                  background: currentUser.role === 'student'
                    ? 'linear-gradient(135deg, #06B6D4, #3B82F6)'
                    : currentUser.role === 'examiner'
                    ? 'linear-gradient(135deg, #818CF8, #6366F1)'
                    : 'linear-gradient(135deg, #F59E0B, #EF4444)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isDarkMode ? '#FFFFFF' : '#1E293B' }}>
                    {currentUser.full_name || 'Candidate'}
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
                  width: '210px',
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
                    <UserCheck size={14} /> Student Portal
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
                    <Shield size={14} /> Examiner Studio
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

                  {onLogout && (
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}` }}>
                      <button
                        onClick={() => { setShowRoleDropdown(false); onLogout(); }}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#EF4444',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <LogOut size={14} /> Sign Out / Logout
                      </button>
                    </div>
                  )}
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
