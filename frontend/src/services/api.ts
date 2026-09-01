import {
  User, Exam, Question, StudentExamPaper,
  GradingQueueItem, ExamResultData, UserRole
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

class ApiService {
  private token: string | null = null;
  private currentUser: User | null = null;

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

  setAuth(token: string, user: User) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  logout() {
    this.token = null;
    this.currentUser = null;
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
