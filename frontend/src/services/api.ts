import {
  User, Exam, Question, StudentExamPaper,
  GradingQueueItem, ExamResultData, UserRole
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8000/api/v1';

class ApiService {
  private token: string | null = null;
  private currentUser: User | null = null;
  private inflightGetMe: Promise<User | null> | null = null;
  private lastVerifiedAt: number = 0;

  constructor() {
    this.token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  getBaseUrl(): string {
    return API_BASE_URL;
  }

  getHealthUrl(): string {
    return API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/health';
  }

  setAuth(token: string, user: User) {
    this.token = token;
    this.currentUser = user;
    this.inflightGetMe = null;
    this.lastVerifiedAt = Date.now();
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    this.inflightGetMe = null;
    this.lastVerifiedAt = 0;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Fast, non-blocking health check with strict timeout
  async checkHealth(timeoutMs = 2500): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(this.getHealthUrl(), {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timer);
      return resp.ok;
    } catch {
      clearTimeout(timer);
      return false;
    }
  }

  // ----------------- Auth API -----------------
  async autoLoginAsRole(role: UserRole): Promise<{ access_token: string; user: User }> {
    let email = 'alex@examora.io';
    let password = 'student123';

    if (role === 'examiner') {
      email = 'examiner@examora.io';
      password = 'examiner123';
    } else if (role === 'admin') {
      email = 'admin@examora.io';
      password = 'admin123';
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (resp.ok) {
        const data = await resp.json();
        this.setAuth(data.access_token, data.user);
        return data;
      }
    } catch (e) {
      console.warn('Auto-login fetch error, falling back to cached role', e);
    }

    const fallbackUser: User = {
      id: role === 'student' ? 'st-01' : (role === 'examiner' ? 'ex-01' : 'adm-01'),
      email,
      full_name: role === 'student' ? 'Alex Mercer (Candidate)' : (role === 'examiner' ? 'Prof. Sarah Connor' : 'Dr. Alan Vance (Admin)'),
      role,
      is_active: true
    };
    return { access_token: 'mock-jwt-token', user: fallbackUser };
  }

  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const resp = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await resp.json();
    this.setAuth(data.access_token, data.user);
    return data;
  }

  async register(data: { email: string; password: string; full_name: string; role: UserRole }): Promise<{ access_token: string; user: User }> {
    const resp = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    // Automatically log in after registration
    return this.login(data.email, data.password);
  }

  /**
   * Deduplicated and cached session verification.
   * If a verification call is already inflight, returns the same promise to prevent duplicate API requests.
   * If verified within 15 seconds, returns the verified user immediately.
   */
  async getMe(force = false): Promise<User | null> {
    if (!this.token) {
      this.currentUser = null;
      return null;
    }

    const now = Date.now();
    if (!force && this.currentUser && (now - this.lastVerifiedAt < 15000)) {
      return this.currentUser;
    }

    if (this.inflightGetMe) {
      return this.inflightGetMe;
    }

    this.inflightGetMe = (async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: this.getHeaders(),
        });
        if (resp.ok) {
          const user = await resp.json();
          this.currentUser = user;
          this.lastVerifiedAt = Date.now();
          localStorage.setItem('current_user', JSON.stringify(user));
          return user;
        } else if (resp.status === 401 || resp.status === 403) {
          // Token expired or invalid
          this.logout();
          return null;
        }
      } catch (e) {
        console.warn('Could not verify /auth/me with backend, using cached session if available', e);
      } finally {
        this.inflightGetMe = null;
      }
      return this.currentUser;
    })();

    return this.inflightGetMe;
  }

  // ----------------- Exams API -----------------
  async getExams(publishedOnly = false): Promise<Exam[]> {
    const resp = await fetch(`${API_BASE_URL}/exams/?published_only=${publishedOnly}`, {
      headers: this.getHeaders(),
    });
    if (!resp.ok) throw new Error('Failed to fetch exams');
    return resp.json();
  }

  async createExam(examData: Partial<Exam> & { question_ids?: string[] }): Promise<Exam> {
    const resp = await fetch(`${API_BASE_URL}/exams/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(examData),
    });
    if (!resp.ok) throw new Error('Failed to create exam');
    return resp.json();
  }

  async updateExam(examId: string, examData: Partial<Exam> & { question_ids?: string[] }): Promise<Exam> {
    const resp = await fetch(`${API_BASE_URL}/exams/${examId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(examData),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Failed to update exam' }));
      throw new Error(err.detail || 'Failed to update exam');
    }
    return resp.json();
  }

  async deleteExam(examId: string): Promise<{ message: string; id: string }> {
    const resp = await fetch(`${API_BASE_URL}/exams/${examId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Failed to delete exam' }));
      throw new Error(err.detail || 'Failed to delete exam');
    }
    return resp.json();
  }

  // ----------------- Questions API -----------------
  async getQuestions(subject?: string): Promise<Question[]> {
    const url = subject ? `${API_BASE_URL}/questions/?subject=${encodeURIComponent(subject)}` : `${API_BASE_URL}/questions/`;
    const resp = await fetch(url, { headers: this.getHeaders() });
    if (!resp.ok) throw new Error('Failed to fetch questions');
    return resp.json();
  }

  async createQuestion(questionData: Partial<Question>): Promise<Question> {
    const resp = await fetch(`${API_BASE_URL}/questions/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(questionData),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Failed to create question' }));
      throw new Error(err.detail || 'Failed to create question');
    }
    return resp.json();
  }

  // ----------------- Exam Session API -----------------
  async startExamSession(examId: string): Promise<StudentExamPaper> {
    const resp = await fetch(`${API_BASE_URL}/sessions/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ exam_id: examId }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Failed to start exam session' }));
      throw new Error(err.detail || 'Failed to start exam session');
    }
    return resp.json();
  }

  async getExamPaper(sessionId: string): Promise<StudentExamPaper> {
    const resp = await fetch(`${API_BASE_URL}/sessions/paper/${sessionId}`, {
      headers: this.getHeaders(),
    });
    if (!resp.ok) throw new Error('Failed to load exam paper');
    return resp.json();
  }

  async saveAnswer(payload: {
    session_id: string;
    question_id: string;
    selected_option_ids?: string[];
    text_response?: string;
    image_base64?: string;
  }) {
    const resp = await fetch(`${API_BASE_URL}/answers/save`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error('Failed to save answer');
    return resp.json();
  }

  async submitFinalExam(sessionId: string) {
    const resp = await fetch(`${API_BASE_URL}/sessions/submit-final/${sessionId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!resp.ok) throw new Error('Failed to submit exam');
    return resp.json();
  }

  // ----------------- Proctoring Telemetry -----------------
  createProctorWebSocket(sessionId: string, onMessage: (data: any) => void): WebSocket {
    const ws = new WebSocket(`ws://localhost:8000/api/v1/proctoring/ws/proctor/${sessionId}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };
    return ws;
  }

  async sendProctorTelemetry(telemetry: any) {
    try {
      const resp = await fetch(`${API_BASE_URL}/proctoring/telemetry`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(telemetry),
      });
      if (resp.ok) {
        return resp.json();
      }
    } catch (e) {
      console.warn('REST proctor telemetry dispatch error:', e);
    }
    return null;
  }

  async getLiveProctorOverview() {
    const resp = await fetch(`${API_BASE_URL}/proctoring/live-overview`, {
      headers: this.getHeaders(),
    });
    if (!resp.ok) throw new Error('Failed to fetch live proctoring overview');
    return resp.json();
  }

  // ----------------- Examiner Grading API -----------------
  async getGradingQueue(examId?: string): Promise<GradingQueueItem[]> {
    const url = examId ? `${API_BASE_URL}/evaluations/queue?exam_id=${examId}` : `${API_BASE_URL}/evaluations/queue`;
    const resp = await fetch(url, { headers: this.getHeaders() });
    if (!resp.ok) throw new Error('Failed to fetch grading queue');
    return resp.json();
  }

  async submitExaminerGrade(payload: {
    answer_id: string;
    final_score: number;
    examiner_feedback?: string;
    image_annotations?: any[];
  }) {
    const resp = await fetch(`${API_BASE_URL}/evaluations/submit-grade`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error('Failed to submit grade');
    return resp.json();
  }

  async publishExamResults(examId: string) {
    const resp = await fetch(`${API_BASE_URL}/evaluations/publish-results/${examId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!resp.ok) throw new Error('Failed to publish results');
    return resp.json();
  }

  // ----------------- Results API -----------------
  async getStudentResult(sessionId: string): Promise<ExamResultData> {
    const resp = await fetch(`${API_BASE_URL}/results/student/session/${sessionId}`, {
      headers: this.getHeaders(),
    });
    if (!resp.ok) throw new Error('Failed to load exam results');
    return resp.json();
  }
}

export const api = new ApiService();
