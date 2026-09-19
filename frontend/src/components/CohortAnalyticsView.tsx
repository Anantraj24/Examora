import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Users, Award, TrendingUp, Sparkles, CheckCircle2, 
  AlertCircle, ChevronDown, RefreshCw, Send, Layers, HelpCircle, ArrowUpRight
} from 'lucide-react';
import { Exam, CohortAnalyticsData } from '../types';
import { api } from '../services/api';

export const CohortAnalyticsView: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [analytics, setAnalytics] = useState<CohortAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load available exams
  useEffect(() => {
    async function loadExams() {
      try {
        const data = await api.getExams();
        if (data && data.length > 0) {
          setExams(data);
          setSelectedExamId(data[0].id);
        }
      } catch (err) {
        console.warn('Failed to fetch exams for cohort analytics', err);
      }
    }
    loadExams();
  }, []);

  // Fetch cohort analytics when selected exam changes
  const fetchCohortData = async (examId: string) => {
    if (!examId) return;
    setIsLoading(true);
    setError(null);
    setPublishSuccess(false);
    try {
      const data = await api.getCohortAnalytics(examId);
      setAnalytics(data);
    } catch (err: any) {
      console.warn('Cohort analytics fetch fallback', err);
      setError(err.message || 'Unable to load analytics for this examination.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchCohortData(selectedExamId);
    }
  }, [selectedExamId]);

  const handlePublishResults = async () => {
    if (!selectedExamId) return;
    setIsPublishing(true);
    try {
      await api.publishExamResults(selectedExamId);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 5000);
    } catch (err: any) {
      alert('Failed to publish cohort results: ' + (err.message || 'Error occurred'));
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedExam = exams.find(e => e.id === selectedExamId);
  const totalMaxMarks = selectedExam?.total_marks || 100;

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. TOP HEADER & EXAM SELECTOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
            <div style={{ 
              width: '28px', height: '28px', borderRadius: '8px', 
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' 
            }}>
              <BarChart2 size={16} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
              Cohort Performance & Score Analytics
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
            Aggregated psychometric distribution, pass rates, and comparative statistics across student examination cohorts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Exam Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="dash-input"
              style={{
                padding: '8px 36px 8px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                borderRadius: '10px',
                cursor: 'pointer',
                appearance: 'none',
                minWidth: '280px'
              }}
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.subject})
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
          </div>

          <button
            onClick={() => fetchCohortData(selectedExamId)}
            className="dash-icon-btn"
            title="Refresh Cohort Data"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={handlePublishResults}
            disabled={isPublishing || publishSuccess}
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: publishSuccess ? '#10B981' : undefined
            }}
          >
            {publishSuccess ? <CheckCircle2 size={16} /> : <Send size={16} />}
            <span>{publishSuccess ? 'Results Published' : 'Publish Cohort Results'}</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Total Candidates */}
        <div className="dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Total Candidates
            </span>
            <Users size={18} color="#6366F1" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {analytics?.total_candidates ?? 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
            Submissions evaluated in cohort
          </span>
        </div>

        {/* Cohort Mean Score */}
        <div className="dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Cohort Mean Score
            </span>
            <TrendingUp size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981' }}>
            {analytics?.average_score?.toFixed(1) ?? '0.0'} pts
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
            {analytics ? `${Math.round(((analytics.average_score || 0) / Math.max(1, totalMaxMarks)) * 100)}% cohort average` : 'No data'}
          </span>
        </div>

        {/* Highest Score */}
        <div className="dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Highest Mark
            </span>
            <Award size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>
            {analytics?.highest_score ?? 0} pts
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
            Top percentile benchmark
          </span>
        </div>

        {/* Lowest Score */}
        <div className="dash-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Lowest Mark
            </span>
            <AlertCircle size={18} color="#94A3B8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {analytics?.lowest_score ?? 0} pts
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
            Minimum score recorded
          </span>
        </div>
      </div>

      {/* 3. SCORE DISTRIBUTION HISTOGRAM / BELL CURVE */}
      <div className="dash-card" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              Cohort Percentile & Score Distribution
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Candidate breakdown clustered into 5 distinct quintile brackets (0–20%, 21–40%, 41–60%, 61–80%, 81–100%).
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5' }}>
            Standard Bell Curve
          </span>
        </div>

        {/* Histogram Bars */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          height: '240px',
          padding: '1rem 0',
          borderBottom: '2px solid #E2E8F0',
          gap: '1rem'
        }}>
          {['0-20', '21-40', '41-60', '61-80', '81-100'].map((bracket) => {
            const count = analytics?.score_distribution?.[bracket] ?? 0;
            const maxCount = Math.max(1, ...Object.values(analytics?.score_distribution || { '0-20': 1 }));
            const heightPercent = Math.max(15, (count / maxCount) * 100);

            const isPeak = count === maxCount && count > 0;

            return (
              <div 
                key={bracket}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  height: '100%',
                  justifyContent: 'flex-end',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isPeak ? '#4F46E5' : '#64748B' }}>
                  {count} {count === 1 ? 'student' : 'students'}
                </span>

                <div 
                  style={{
                    width: '100%',
                    maxWidth: '80px',
                    height: `${heightPercent}%`,
                    background: isPeak 
                      ? 'linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)' 
                      : 'linear-gradient(180deg, #CBD5E1 0%, #94A3B8 100%)',
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.3s ease',
                    boxShadow: isPeak ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none'
                  }}
                />

                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                  {bracket}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend / Metrics Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem', fontSize: '0.8rem', color: '#64748B' }}>
          <div>Below Average (0–40%): <strong>{(analytics?.score_distribution?.['0-20'] || 0) + (analytics?.score_distribution?.['21-40'] || 0)}</strong></div>
          <div>Cohort Median (41–60%): <strong>{analytics?.score_distribution?.['41-60'] || 0}</strong></div>
          <div>Distinction (61–100%): <strong>{(analytics?.score_distribution?.['61-80'] || 0) + (analytics?.score_distribution?.['81-100'] || 0)}</strong></div>
        </div>
      </div>

    </div>
  );
};
