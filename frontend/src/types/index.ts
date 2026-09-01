export type UserRole = 'student' | 'examiner' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export type QuestionType = 'MCQ' | 'multi_select' | 'short_answer' | 'long_answer' | 'image_upload';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface QuestionOption {
  id?: string;
  question_id?: string;
  option_text: string;
  is_correct?: boolean;
  sort_order: number;
}

export interface RubricCriterion {
  criterion: string;
  points: number;
}

export interface Question {
  id: string;
  subject: string;
  topic?: string;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  content: string;
  model_answer?: string;
  rubric_criteria?: RubricCriterion[];
  max_marks: number;
  negative_marks: number;
  options?: QuestionOption[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  instructions?: string;
  duration_minutes: number;
  start_window?: string;
  end_window?: string;
  blueprint_rules?: {
    easy_count?: number;
    medium_count?: number;
    hard_count?: number;
  };
  proctoring_config?: {
    webcam_required?: boolean;
    gaze_tracking?: boolean;
    multi_face_detection?: boolean;
    max_tab_switches?: number;
    gaze_sensitivity?: number;
  };
  is_published: boolean;
  total_questions?: number;
  total_marks?: number;
}

export interface PaperQuestionView {
  id: string;
  order_index: number;
  question_type: QuestionType;
  difficulty?: DifficultyLevel;
  content: string;
  max_marks: number;
  negative_marks: number;
  options: QuestionOption[];
  saved_answer?: {
    selected_option_ids?: string[];
    text_response?: string;
    image_path?: string;
    word_count?: number;
  };
}

export interface StudentExamPaper {
  session_id: string;
  session_token?: string;
  exam_id: string;
  title?: string;
  exam_title?: string;
  subject?: string;
  duration_minutes: number;
  server_deadline: string;
  seconds_remaining?: number;
  server_time_remaining_seconds?: number;
  proctoring_config?: Record<string, any>;
  questions: PaperQuestionView[];
}

export interface ProctorTelemetry {
  session_id: string;
  timestamp?: string;
  face_detected: boolean;
  face_count: number;
  gaze_direction: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'OFF_SCREEN';
  gaze_score: number;
  tab_hidden: boolean;
  window_blurred: boolean;
  snapshot_base64?: string;
}

export interface ProctorAlert {
  id?: string;
  type?: string;
  session_id: string;
  student_name: string;
  exam_title?: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  suspicion_score?: number;
  events?: Array<{
    event_type: string;
    suspicion_delta: number;
    message: string;
  }>;
  snapshot_path?: string;
  timestamp: string;
}

export interface GradingQueueItem {
  answer_id: string;
  session_id?: string;
  student_id: string;
  student_name: string;
  question_id: string;
  question_content: string;
  question_type: QuestionType;
  max_marks: number;
  model_answer?: string;
  rubric_criteria?: RubricCriterion[];
  student_text?: string;
  student_text_response?: string;
  image_url?: string;
  ocr_text?: string;
  ocr_extracted_text?: string;
  ai_suggested_score?: number;
  ai_justification?: string;
  ai_evaluation?: {
    suggested_score: number;
    justification: string;
    rubric_breakdown?: {
      key_concepts_matched?: string[];
      key_concepts_missed?: string[];
      content_coverage_ratio?: number;
      criteria_scores?: Record<string, string>;
    };
  };
  current_examiner_score?: number;
  final_examiner_score?: number;
  examiner_feedback?: string;
  image_annotations?: Array<{
    x: number;
    y: number;
    text: string;
    color: string;
  }>;
}

export interface QuestionResultBreakdown {
  question_id: string;
  order_index?: number;
  question_type: QuestionType;
  question_content: string;
  max_marks: number;
  negative_marks?: number;
  marks_awarded?: number;
  score_awarded?: number;
  status?: string;
  is_correct?: boolean;
  selected_options?: string[];
  correct_options?: string[];
  student_text?: string;
  student_response?: string;
  model_answer?: string;
  examiner_feedback?: string;
  ai_justification?: string;
  image_url?: string;
  image_annotations?: any[];
}

export interface ExamResultData {
  session_id: string;
  student_name?: string;
  exam_title: string;
  subject?: string;
  objective_score: number;
  subjective_score: number;
  total_score: number;
  max_possible_score: number;
  percentage?: number | string;
  percentile: number;
  integrity_status?: string;
  is_published: boolean;
  evaluated_at: string;
  cohort_stats?: {
    mean: number;
    median: number;
    standard_deviation: number;
    distribution: Array<{
      bracket: string;
      count: number;
    }>;
  };
  question_breakdown: QuestionResultBreakdown[];
}
