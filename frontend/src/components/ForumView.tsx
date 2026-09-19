import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Search, X, Filter, Plus, 
  Send, ThumbsUp, MessageCircle, ChevronLeft, ChevronRight, 
  Trash2, User as UserIcon, Loader2, AlertCircle, Sparkles, BookOpen
} from 'lucide-react';
import { User, ForumPost, ForumReply } from '../types';
import { api } from '../services/api';

interface ForumViewProps {
  currentUser: User;
}

export const ForumView: React.FC<ForumViewProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('recent');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Expanded post for viewing / posting replies
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState<{ [postId: string]: string }>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  // New Discussion Modal State
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('Computer Science');
  const [newTag, setNewTag] = useState<string>('Question');
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Debounce search query by 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // Reset to page 1 on query change
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load forum posts
  const loadPosts = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const resp = await api.getForumPosts({
        q: debouncedQuery,
        subject: selectedSubject,
        tag: selectedTag,
        sort_by: sortBy,
        page: currentPage,
        page_size: 6
      });
      setPosts(resp.items);
      setTotalCount(resp.total);
      setTotalPages(resp.total_pages);
    } catch (err: any) {
      console.warn('Failed to load forum posts:', err);
      setErrorMsg(err.message || 'Unable to connect to academic forum repository.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [debouncedQuery, selectedSubject, selectedTag, sortBy, currentPage]);

  // Submit New Discussion Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsCreatingPost(true);
    setCreateError(null);
    try {
      await api.createForumPost({
        title: newTitle.trim(),
        content: newContent.trim(),
        subject: newSubject,
        tag: newTag
      });
      setNewTitle('');
      setNewContent('');
      setIsNewPostModalOpen(false);
      setCurrentPage(1);
      await loadPosts();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to publish post');
    } finally {
      setIsCreatingPost(false);
    }
  };

  // Submit Reply to Post
  const handleAddReply = async (postId: string) => {
    const content = replyInput[postId]?.trim();
    if (!content) return;

    setIsSubmittingReply(true);
    try {
      await api.addForumReply(postId, content);
      setReplyInput(prev => ({ ...prev, [postId]: '' }));
      // Reload the updated post details
      const updatedPost = await api.getForumPost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    } catch (err: any) {
      alert(`Failed to post reply: ${err.message}`);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteForumPost(postId);
      await loadPosts();
    } catch (err: any) {
      alert(`Failed to delete discussion: ${err.message}`);
    }
  };

  const subjectOptions = ['All', 'Computer Science', 'Distributed Systems', 'Artificial Intelligence', 'Mathematics'];
  const tagOptions = ['All', 'Question', 'Discussion', 'Exam Prep'];

  return (
    <div style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Header Banner */}
      <div className="dash-card" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(59, 94, 219, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1px solid rgba(59, 94, 219, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3B5EDB, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <MessageSquare size={20} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
              Academic Discussion Forum
            </h2>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '4px 0 0 0', maxWidth: '720px' }}>
            Engage with verified faculty mentors, proctoring supervisors, and peers. Ask technical questions, clarify algorithm logic, and prepare for upcoming exams.
          </p>
        </div>

        <button
          onClick={() => setIsNewPostModalOpen(true)}
          className="btn btn-primary"
          style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} />
          <span>Start New Discussion</span>
        </button>
      </div>

      {/* 2. Search, Filter & Sort Bar */}
      <div className="dash-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Search & Sort Row */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8'
              }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions by question title, concept, algorithm, or reply..."
              style={{
                width: '100%',
                padding: '12px 42px 12px 42px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: 'inherit',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'inherit',
                fontSize: '0.84rem'
              }}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular / Upvoted</option>
              <option value="unanswered">Unanswered Questions</option>
            </select>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.85rem' }}>
          {/* Subject Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginRight: '4px' }}>Subject:</span>
            {subjectOptions.map((subj) => (
              <button
                key={subj}
                onClick={() => {
                  setSelectedSubject(subj);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '4px 11px',
                  borderRadius: '9999px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  border: selectedSubject === subj ? '1px solid #3B5EDB' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: selectedSubject === subj ? 'rgba(59, 94, 219, 0.15)' : 'transparent',
                  color: selectedSubject === subj ? '#3B5EDB' : '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Tag Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginRight: '4px' }}>Tag:</span>
            {tagOptions.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedTag(t);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '4px 11px',
                  borderRadius: '9999px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  border: selectedTag === t ? '1px solid #8B5CF6' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: selectedTag === t ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: selectedTag === t ? '#A78BFA' : '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Forum Discussions List */}
      {errorMsg ? (
        <div className="dash-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#EF4444' }}>
          <AlertCircle size={36} style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0' }}>Failed to Load Discussions</h4>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginBottom: '1.25rem' }}>{errorMsg}</p>
          <button onClick={loadPosts} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Retry Loading
          </button>
        </div>
      ) : isLoading ? (
        <div className="dash-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px auto', color: '#3B5EDB' }} />
          <p style={{ margin: 0, fontSize: '0.92rem' }}>Querying forum threads and discussions...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="dash-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Search size={40} style={{ margin: '0 auto 14px auto', color: '#64748B', opacity: 0.5 }} />
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'inherit', margin: '0 0 6px 0' }}>
            No Discussion Posts Found
          </h4>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            {searchQuery 
              ? `No threads matched your search term "${searchQuery}" with the active filters.`
              : 'There are currently no discussions under these filters.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Clear Search Query
              </button>
            )}
            {(selectedSubject !== 'All' || selectedTag !== 'All') && (
              <button
                onClick={() => {
                  setSelectedSubject('All');
                  setSelectedTag('All');
                }}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.map((post) => {
            const isExpanded = expandedPostId === post.id;
            const canDelete = post.author_id === currentUser.id || currentUser.role !== 'student';

            return (
              <div
                key={post.id}
                className="dash-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'border-color 0.15s ease'
                }}
              >
                {/* Header Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(59, 94, 219, 0.12)',
                      color: '#3B5EDB'
                    }}>
                      {post.subject}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(139, 92, 246, 0.12)',
                      color: '#A78BFA'
                    }}>
                      {post.tag}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: '#94A3B8' }}>
                    <span>Posted by <strong>{post.author_name}</strong></span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeletePost(post.id, post.title)}
                        className="dash-icon-btn"
                        style={{ color: '#EF4444', padding: '4px' }}
                        title="Delete discussion"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title and Content */}
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.55, margin: 0 }}>
                    {post.content}
                  </p>
                </div>

                {/* Footer Controls: Replies & Expand */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'transparent',
                      border: 'none',
                      color: '#3B5EDB',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      padding: '4px 0'
                    }}
                  >
                    <MessageCircle size={15} />
                    <span>{post.replies_count} {post.replies_count === 1 ? 'reply' : 'replies'}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({isExpanded ? 'Hide' : 'View & Reply'})</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748B' }}>
                    <ThumbsUp size={13} color="#10B981" />
                    <span>{post.upvotes} upvotes</span>
                  </div>
                </div>

                {/* Expandable Replies Section */}
                {isExpanded && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '1.25rem',
                    background: 'rgba(15, 23, 42, 0.3)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#E2E8F0' }}>
                      Responses & Mentorship Answers
                    </h4>

                    {/* Existing Replies */}
                    {post.replies && post.replies.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {post.replies.map((reply) => (
                          <div
                            key={reply.id}
                            style={{
                              padding: '0.85rem 1rem',
                              background: 'rgba(30, 41, 59, 0.6)',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC' }}>
                                {reply.author_name} {reply.author_role === 'examiner' && <span style={{ color: '#3B5EDB', fontSize: '0.72rem' }}>(Faculty/Mentor)</span>}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                {new Date(reply.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: 0, lineHeight: 1.45 }}>
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                        No replies yet. Be the first to answer!
                      </p>
                    )}

                    {/* Reply Input Box */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '0.25rem' }}>
                      <input
                        type="text"
                        value={replyInput[post.id] || ''}
                        onChange={(e) => setReplyInput({ ...replyInput, [post.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddReply(post.id);
                        }}
                        placeholder="Write a helpful response or clarification..."
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'inherit',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => handleAddReply(post.id)}
                        disabled={isSubmittingReply || !replyInput[post.id]?.trim()}
                        className="btn btn-primary"
                        style={{ padding: '8px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Send size={13} />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* 4. Server-Side Pagination Bar */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '0.5rem' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>

          <span style={{ fontSize: '0.84rem', color: '#94A3B8', fontWeight: 600 }}>
            Page {currentPage} of {totalPages} ({totalCount} discussions)
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* 5. Start New Discussion Modal */}
      {isNewPostModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="dash-card" style={{
            width: '100%',
            maxWidth: '560px',
            padding: '2rem',
            background: 'var(--bg-card, #1E293B)',
            borderRadius: '16px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'inherit' }}>
                  Start a Discussion
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                  Ask a question or share a study topic with your academic cohort.
                </p>
              </div>
              <button onClick={() => setIsNewPostModalOpen(false)} className="dash-icon-btn" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                fontSize: '0.84rem',
                marginBottom: '1rem'
              }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '5px' }}>
                  Discussion Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Invariant preservation in distributed Paxos rounds"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'inherit',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '5px' }}>
                    Subject
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'inherit',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Distributed Systems">Distributed Systems</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '5px' }}>
                    Tag / Category
                  </label>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'inherit',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="Question">Question</option>
                    <option value="Discussion">Discussion</option>
                    <option value="Exam Prep">Exam Prep</option>
                    <option value="Announcement">Announcement</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '5px' }}>
                  Question / Topic Content
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Explain your thought process, what you have tried, or specify what needs clarification..."
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'inherit',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPost}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isCreatingPost && <Loader2 className="animate-spin" size={14} />}
                  <span>Post Discussion</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
