/**
 * EduVerse AI - Innovation Modules Service (Phase 6.5)
 * Typed API clients for:
 * 1. Multilingual Voice Assistant
 * 2. AI Smart Examination Simulator
 * 3. Smart Notes Scanner & Doubt Solver
 * 4. AI Smart Timetable & Scheduler
 * 5. Gamification & Verified Achievements
 * 6. Visual Knowledge Map
 * 7. Intelligent Early-Warning & Intervention System
 */

import api from './api';

// ============================================================================
// 1. Voice Assistant Types
// ============================================================================

export interface VoiceQueryRequest {
  transcript: string;
  language?: string;
  prompt_context?: string;
  target_role?: string;
}

export interface VoiceQueryResponse {
  transcript: string;
  detected_language: string;
  answer_text: string;
  target_role: string;
  audio_url?: string;
  tts_metadata?: {
    suggested_lang_code: string;
    rate: number;
    pitch: number;
  };
}

// ============================================================================
// 2. Exam Simulator Types
// ============================================================================

export interface CreateExamRequest {
  title: string;
  subject: string;
  grade_level?: string;
  chapter_or_topic: string;
  num_questions?: number;
  total_marks?: number;
  duration_minutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'adaptive';
  question_types?: string[];
  language?: string;
}

export interface MockExamQuestion {
  id: string;
  question_number: number;
  question_text: string;
  question_type: string;
  topic?: string;
  marks: number;
  options?: string[];
  correct_answer?: string;
  rubric_criteria?: string;
}

export interface MockExam {
  id: string;
  title: string;
  subject: string;
  chapter_or_topic: string;
  num_questions: number;
  total_marks: number;
  duration_minutes: number;
  difficulty: string;
  language: string;
  questions?: MockExamQuestion[];
  created_at: string;
}

export interface ExamAttempt {
  id: string;
  mock_exam_id: string;
  student_id: string;
  status: 'started' | 'in_progress' | 'completed' | 'abandoned';
  score?: number;
  max_score?: number;
  percentage?: number;
  passed?: boolean;
  time_taken_seconds?: number;
  subject_breakdown?: Record<string, number>;
  topic_breakdown?: Record<string, number>;
  answers?: any[];
  started_at: string;
  completed_at?: string;
}

// ============================================================================
// 3. OCR Notes Scanner Types
// ============================================================================

export interface UploadScannedDocRequest {
  title: string;
  file_name?: string;
  document_type?: 'notes' | 'handout' | 'homework' | 'diagram';
  language?: string;
  raw_text?: string;
}

export interface ScannedDocument {
  id: string;
  student_id: string;
  title: string;
  file_name?: string;
  document_type: string;
  ocr_status: string;
  ocr_confidence?: number;
  language: string;
  page_count: number;
  extracted_text?: {
    id: string;
    raw_ocr_text: string;
    cleaned_text: string;
    user_edited_text?: string;
    extracted_formulas?: string[];
    key_terms?: string[];
    updated_at: string;
  };
  created_at: string;
}

// ============================================================================
// 4. Smart Timetable Types
// ============================================================================

export interface GenerateScheduleRequest {
  schedule_title?: string;
  daily_available_hours?: number;
  optimization_goal?: 'balanced' | 'gap_focused' | 'exam_cram';
  days_ahead?: number;
}

export interface StudySession {
  id: string;
  timetable_id: string;
  subject_name: string;
  topic_name: string;
  session_type: string;
  day_of_week: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  priority: string;
  linked_gap_id?: string;
  is_completed: boolean;
  completed_at?: string;
  missed_and_rescheduled: boolean;
}

export interface StudyTimetable {
  id: string;
  student_id: string;
  schedule_title: string;
  start_date: string;
  end_date: string;
  daily_available_hours: number;
  status: string;
  optimization_goal: string;
  ai_generated_notes?: string;
  sessions: StudySession[];
  created_at: string;
}

// ============================================================================
// 5. Gamification Types
// ============================================================================

export interface AchievementBadge {
  id: string;
  badge_code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  xp_reward: number;
  criteria_summary: string;
  is_earned?: boolean;
}

export interface EarnedBadge {
  id: string;
  badge_id: string;
  badge: AchievementBadge;
  earned_at: string;
  evidence_note?: string;
}

export interface GamificationProfile {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  level_title: string;
  streak_days: number;
  longest_streak_days: number;
  daily_goal_xp: number;
  today_xp: number;
  leaderboard_opt_in: boolean;
  earned_badges: EarnedBadge[];
  recent_transactions: Array<{
    id: string;
    amount: number;
    reason: string;
    created_at: string;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  total_xp: number;
  current_level: number;
  level_title: string;
  streak_days: number;
}

// ============================================================================
// 6. Visual Knowledge Map Types
// ============================================================================

export interface KnowledgeNode {
  id: string;
  institution_id: string;
  subject_id?: string;
  node_type: string;
  label: string;
  description?: string;
  difficulty: string;
  estimated_hours: number;
  pos_x: number;
  pos_y: number;
  mastery_state: 'mastered' | 'in_progress' | 'needs_attention' | 'unvisited';
  mastery_score: number;
}

export interface KnowledgeEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  weight: number;
}

export interface KnowledgeMapGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  mastery_summary: Record<string, number>;
}

export interface KnowledgeNodeDetail {
  node: KnowledgeNode;
  prerequisites: KnowledgeNode[];
  unlocked_topics: KnowledgeNode[];
  related_study_materials: Array<{ title: string; type: string; pages: number }>;
  recommended_activities: Array<{ title: string; type: string; duration: string }>;
}

// ============================================================================
// 7. Early Warning & Intervention Types
// ============================================================================

export interface EarlyWarningAlert {
  id: string;
  institution_id: string;
  student_id: string;
  student_name?: string;
  class_id?: string;
  risk_level: 'watch' | 'moderate' | 'high' | 'critical';
  alert_category: string;
  title: string;
  evidence_summary: string;
  recommended_intervention: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  created_at: string;
}

export interface InterventionRecord {
  id: string;
  alert_id?: string;
  teacher_id: string;
  student_id: string;
  action_type: string;
  scheduled_for?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  outcome_evaluation?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentEarlyWarningSummary {
  student_id: string;
  total_alerts: number;
  active_alerts: number;
  highest_risk_level: string;
  recent_interventions: InterventionRecord[];
  parent_supportive_advice: {
    en: string;
    te: string;
    hi: string;
  };
}

// ============================================================================
// Service API Implementations
// ============================================================================

export const innovationService = {
  // Voice Assistant
  async queryVoice(req: VoiceQueryRequest): Promise<VoiceQueryResponse> {
    const res = await api.post<VoiceQueryResponse>('/voice/transcribe-and-query', req);
    return res.data;
  },

  // Exam Simulator
  async generateMockExam(req: CreateExamRequest): Promise<MockExam> {
    const res = await api.post<MockExam>('/examinations/generate', req);
    return res.data;
  },

  async getMyExams(): Promise<MockExam[]> {
    const res = await api.get<MockExam[]>('/examinations/my-exams');
    return res.data;
  },

  async getExamDetails(examId: string): Promise<MockExam> {
    const res = await api.get<MockExam>(`/examinations/${examId}`);
    return res.data;
  },

  async startExamAttempt(examId: string): Promise<ExamAttempt> {
    const res = await api.post<ExamAttempt>(`/examinations/${examId}/start`);
    return res.data;
  },

  async submitExamAttempt(
    attemptId: string,
    answers: Array<{ question_id: string; student_answer: string }>,
    timeTakenSeconds: number = 0
  ): Promise<ExamAttempt> {
    const res = await api.post<ExamAttempt>(`/examinations/attempts/${attemptId}/submit`, {
      answers,
      time_taken_seconds: timeTakenSeconds,
    });
    return res.data;
  },

  async getExamResult(attemptId: string): Promise<ExamAttempt> {
    const res = await api.get<ExamAttempt>(`/examinations/attempts/${attemptId}/result`);
    return res.data;
  },

  // Notes Scanner
  async uploadScannedNote(req: UploadScannedDocRequest): Promise<ScannedDocument> {
    const res = await api.post<ScannedDocument>('/ocr/upload', req);
    return res.data;
  },

  async getMyScannedNotes(): Promise<ScannedDocument[]> {
    const res = await api.get<ScannedDocument[]>('/ocr/documents');
    return res.data;
  },

  async getScannedNote(docId: string): Promise<ScannedDocument> {
    const res = await api.get<ScannedDocument>(`/ocr/documents/${docId}`);
    return res.data;
  },

  async correctScannedText(docId: string, editedText: string): Promise<ScannedDocument> {
    const res = await api.patch<ScannedDocument>(`/ocr/documents/${docId}/correct`, {
      edited_text: editedText,
    });
    return res.data;
  },

  async askDoubtOnNote(docId: string, question: string, language: string = 'en'): Promise<{
    question: string;
    answer: string;
    language: string;
    citations: string[];
    confidence: number;
  }> {
    const res = await api.post(`/ocr/documents/${docId}/ask`, { question, language });
    return res.data;
  },

  async generateQuizFromNote(docId: string, numQuestions: number = 3, language: string = 'en'): Promise<any> {
    const res = await api.post(`/ocr/documents/${docId}/generate-quiz`, {
      num_questions: numQuestions,
      language,
    });
    return res.data;
  },

  // Smart Timetable & Scheduling
  async generateSmartTimetable(req: GenerateScheduleRequest = {}): Promise<StudyTimetable> {
    const res = await api.post<StudyTimetable>('/scheduling/generate', req);
    return res.data;
  },

  async getCurrentTimetable(): Promise<StudyTimetable | null> {
    const res = await api.get<StudyTimetable | null>('/scheduling/current');
    return res.data;
  },

  async toggleSessionCompleted(sessionId: string): Promise<StudySession> {
    const res = await api.patch<StudySession>(`/scheduling/sessions/${sessionId}/complete`);
    return res.data;
  },

  async rescheduleMissedSessions(timetableId: string): Promise<{ status: string; rescheduled_count: number; message: string }> {
    const res = await api.post(`/scheduling/reschedule-missed?timetable_id=${timetableId}`);
    return res.data;
  },

  // Gamification & Badges
  async getGamificationProfile(): Promise<GamificationProfile> {
    const res = await api.get<GamificationProfile>('/gamification/profile');
    return res.data;
  },

  async getAchievements(): Promise<AchievementBadge[]> {
    const res = await api.get<AchievementBadge[]>('/gamification/achievements');
    return res.data;
  },

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const res = await api.get<LeaderboardEntry[]>(`/gamification/leaderboard?limit=${limit}`);
    return res.data;
  },

  async toggleLeaderboardOptIn(optIn: boolean): Promise<GamificationProfile> {
    const res = await api.post<GamificationProfile>(`/gamification/leaderboard/toggle?opt_in=${optIn}`);
    return res.data;
  },

  // Visual Knowledge Map
  async getKnowledgeMap(): Promise<KnowledgeMapGraph> {
    const res = await api.get<KnowledgeMapGraph>('/knowledge-map');
    return res.data;
  },

  async getNodeDetails(nodeId: string): Promise<KnowledgeNodeDetail> {
    const res = await api.get<KnowledgeNodeDetail>(`/knowledge-map/node/${nodeId}/details`);
    return res.data;
  },

  // Early-Warning & Interventions
  async listEarlyWarningAlerts(studentId?: string, riskLevel?: string): Promise<EarlyWarningAlert[]> {
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId);
    if (riskLevel) params.append('risk_level', riskLevel);
    const res = await api.get<EarlyWarningAlert[]>(`/interventions/alerts?${params.toString()}`);
    return res.data;
  },

  async createInterventionAction(data: {
    alert_id?: string;
    student_id: string;
    action_type: string;
    notes?: string;
    scheduled_for?: string;
  }): Promise<InterventionRecord> {
    const res = await api.post<InterventionRecord>('/interventions/actions/create', data);
    return res.data;
  },

  async updateInterventionStatus(actionId: string, data: {
    status: string;
    outcome_evaluation?: string;
    notes?: string;
  }): Promise<InterventionRecord> {
    const res = await api.patch<InterventionRecord>(`/interventions/actions/${actionId}/status`, data);
    return res.data;
  },

  async getStudentInterventionSummary(studentId: string): Promise<StudentEarlyWarningSummary> {
    const res = await api.get<StudentEarlyWarningSummary>(`/interventions/student/${studentId}/summary`);
    return res.data;
  },
};

export default innovationService;
