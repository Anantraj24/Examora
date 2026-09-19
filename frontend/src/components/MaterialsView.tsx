import React, { useState, useEffect, useTransition } from 'react';
import { 
  BookOpen, Search, X, Filter, Download, Plus, 
  FileText, Layers, Trash2, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, Sparkles
} from 'lucide-react';
import { User, CourseMaterial } from '../types';
import { api } from '../services/api';

interface MaterialsViewProps {
  currentUser: User;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({ currentUser }) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add Material Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('Computer Science');
  const [newCategory, setNewCategory] = useState<string>('Handbook');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newPages, setNewPages] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Debounce search input by 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch materials whenever debounced query, subject, or category changes
  const fetchMaterials = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getMaterials({
        q: debouncedQuery,
        subject: selectedSubject,
        category: selectedCategory
      });
      setMaterials(data);
    } catch (err: any) {
      console.warn('Failed to load materials:', err);
      setErrorMsg(err.message || 'Unable to connect to course materials repository.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [debouncedQuery, selectedSubject, selectedCategory]);

  // Handle Add Material
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await api.createMaterial({
        title: newTitle.trim(),
        subject: newSubject,
        category: newCategory,
        description: newDescription.trim() || undefined,
        pages: newPages,
        file_format: 'PDF',
        download_url: '#'
      });

      // Reset form and reload
      setNewTitle('');
      setNewDescription('');
      setIsAddModalOpen(false);
      await fetchMaterials();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save material');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Material
  const handleDeleteMaterial = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}"?`)) return;
    try {
      await api.deleteMaterial(id);
      await fetchMaterials();
    } catch (err: any) {
      alert(`Failed to delete material: ${err.message}`);
    }
  };

  // Download simulation
  const handleDownload = (mat: CourseMaterial) => {
    const content = `Examora Academic Repository\nTitle: ${mat.title}\nSubject: ${mat.subject}\nCategory: ${mat.category}\nFormat: ${mat.file_format} (${mat.pages} pages)\n\nDescription:\n${mat.description || 'No description provided.'}\n\nGenerated for student offline study.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${mat.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_handbook.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const subjectOptions = ['All', 'Computer Science', 'Mathematics', 'Information Systems', 'Artificial Intelligence'];
  const categoryOptions = ['All', 'Handbook', 'Cheat Sheet', 'Reference'];

  return (
    <div style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Header Banner */}
      <div className="dash-card" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(59, 94, 219, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
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
              background: 'linear-gradient(135deg, #3B5EDB, #6366F1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <BookOpen size={20} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
              Course Learning Materials & Reference Guides
            </h2>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '4px 0 0 0', maxWidth: '700px' }}>
            Browse and search curated academic textbooks, algorithmic cheat-sheets, syllabus guidelines, and proctoring exam reference manuals.
          </p>
        </div>

        {currentUser.role !== 'student' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Upload New Material</span>
          </button>
        )}
      </div>

      {/* 2. Interactive Search & Filters Bar */}
      <div className="dash-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Search Input */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            position: 'relative',
            flex: 1,
            minWidth: '280px'
          }}>
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
              placeholder="Search by handbook title, topic, algorithm, keyword, or description..."
              style={{
                width: '100%',
                padding: '12px 42px 12px 42px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: 'inherit',
                fontSize: '0.92rem',
                outline: 'none',
                transition: 'border-color 0.15s ease'
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

          {/* Format / Count Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            color: '#94A3B8',
            fontWeight: 600
          }}>
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Loader2 size={16} className="animate-spin" color="#3B5EDB" /> Searching...
              </span>
            ) : (
              <span><strong>{materials.length}</strong> {materials.length === 1 ? 'material' : 'materials'} available</span>
            )}
          </div>
        </div>

        {/* Filter Badges & Categories */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.85rem' }}>
          
          {/* Subject Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginRight: '4px' }}>
              Subject:
            </span>
            {subjectOptions.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
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

          {/* Category Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginRight: '4px' }}>
              Category:
            </span>
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: selectedCategory === cat ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: selectedCategory === cat ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  color: selectedCategory === cat ? '#10B981' : '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* 3. Materials Grid / Empty / Error State */}
      {errorMsg ? (
        <div className="dash-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#EF4444' }}>
          <AlertCircle size={36} style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0' }}>Failed to Load Materials</h4>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginBottom: '1.25rem' }}>{errorMsg}</p>
          <button onClick={fetchMaterials} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            Retry Loading
          </button>
        </div>
      ) : isLoading ? (
        <div className="dash-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px auto', color: '#3B5EDB' }} />
          <p style={{ margin: 0, fontSize: '0.92rem' }}>Querying course materials database...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="dash-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Search size={40} style={{ margin: '0 auto 14px auto', color: '#64748B', opacity: 0.5 }} />
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'inherit', margin: '0 0 6px 0' }}>
            No Materials Found
          </h4>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            {searchQuery 
              ? `No documents matched your search term "${searchQuery}" with the active filters.`
              : 'There are currently no reference materials under this category/subject filter.'}
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
            {(selectedSubject !== 'All' || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSelectedSubject('All');
                  setSelectedCategory('All');
                }}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="dash-card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div>
                {/* Badges Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '6px',
                    background: 'rgba(59, 94, 219, 0.12)',
                    color: '#3B5EDB'
                  }}>
                    {mat.subject}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10B981'
                  }}>
                    {mat.category}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                  {mat.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '0.84rem',
                  color: '#94A3B8',
                  lineHeight: 1.5,
                  margin: '0 0 1rem 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {mat.description || 'Standard university course study guide and handbook.'}
                </p>

                {/* Meta details */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.76rem',
                  color: '#64748B'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={13} color="#A5B4FC" />
                    {mat.file_format} Format
                  </span>
                  <span>•</span>
                  <span>{mat.pages} Pages</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                <button
                  onClick={() => handleDownload(mat)}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} />
                  <span>Download Handbook</span>
                </button>

                {currentUser.role !== 'student' && (
                  <button
                    onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                    className="dash-icon-btn"
                    style={{ color: '#EF4444', padding: '6px' }}
                    title="Delete handbook"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Upload / Add Material Modal */}
      {isAddModalOpen && (
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
            maxWidth: '540px',
            padding: '2rem',
            background: 'var(--bg-card, #1E293B)',
            borderRadius: '16px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'inherit' }}>
                  Upload Course Learning Material
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                  Add a handbook, cheat-sheet, or syllabus reference to the searchable repository.
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="dash-icon-btn" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            {submitError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                fontSize: '0.84rem',
                marginBottom: '1rem'
              }}>
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '5px' }}>
                  Material Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus & Raft Protocols"
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
                    <option value="Mathematics">Mathematics</option>
                    <option value="Information Systems">Information Systems</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Physics & Computing">Physics & Computing</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '5px' }}>
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
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
                    <option value="Handbook">Handbook</option>
                    <option value="Cheat Sheet">Cheat Sheet</option>
                    <option value="Reference">Reference</option>
                    <option value="Syllabus">Syllabus</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '5px' }}>
                  Description / Topics Covered
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Outline key topics, algorithms, or concepts contained in this document..."
                  rows={3}
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

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '5px' }}>
                  Estimated Pages
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={newPages}
                  onChange={(e) => setNewPages(parseInt(e.target.value) || 1)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                  <span>Save Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
