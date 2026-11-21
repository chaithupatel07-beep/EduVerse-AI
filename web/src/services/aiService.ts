/**
 * EduVerse AI - Frontend Generative AI & Parent Intelligence Service (Phase 4)
 */
import api from './api';

export interface AIMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  language: string;
  sources?: Array<{
    document_name: string;
    page?: number;
    score?: number;
    excerpt?: string;
  }>;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  institution_id: string;
  conversation_type: string;
  student_id?: string;
  title: string;
  language: string;
  created_at: string;
  messages: AIMessage[];
}

export interface ChildTelemetry {
  student_id: string;
  student_name: string;
  grade_level: string;
  attendance_rate: number;
  total_attendance_records: number;
  present_count: number;
  pending_assignments_count: number;
  pending_assignments: Array<{
    id: string;
    title: string;
    due_date: string;
    max_points: number;
  }>;
  average_assignment_grade: number;
  average_quiz_score: number;
  performance_status: string;
}

export interface ParentAIChatResponse {
  answer: string;
  language: string;
  student_name: string;
  telemetry_summary: {
    attendance_rate: number;
    pending_assignments: number;
    average_score: number;
  };
  verified_records_used: boolean;
}

export interface SuggestedInquiry {
  id: string;
  en: string;
  te: string;
  hi: string;
}

export interface QuizQuestionItem {
  question_text: string;
  question_type: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  difficulty: string;
}

export const aiService = {
  // Student & General AI Chat
  async chatWithAI(params: {
    message: string;
    conversation_id?: string;
    conversation_type?: string;
    language?: string;
    use_rag?: boolean;
    course_id?: string;
  }): Promise<AIMessage> {
    const res = await api.post<AIMessage>('/ai/chat', params);
    return res.data;
  },

  async listConversations(type?: string): Promise<AIConversation[]> {
    const res = await api.get<AIConversation[]>('/ai/conversations', {
      params: type ? { conversation_type: type } : {},
    });
    return res.data;
  },

  async getConversation(id: string): Promise<AIConversation> {
    const res = await api.get<AIConversation>(`/ai/conversations/${id}`);
    return res.data;
  },

  // Parent AI Assistant
  async askParentAI(params: {
    student_id: string;
    question: string;
    language?: string;
  }): Promise<ParentAIChatResponse> {
    const res = await api.post<ParentAIChatResponse>('/parent/ai/chat', params);
    return res.data;
  },

  async getChildTelemetry(student_id: string): Promise<ChildTelemetry> {
    const res = await api.get<ChildTelemetry>(`/parent/ai/child-context/${student_id}`);
    return res.data;
  },

  async getSuggestedInquiries(student_id: string, language: string = 'en'): Promise<SuggestedInquiry[]> {
    const res = await api.get<SuggestedInquiry[]>(`/parent/ai/suggestions/${student_id}`, {
      params: { language },
    });
    return res.data;
  },

  // Teacher AI Copilot & Student Formative Tools
  async generateQuiz(params: {
    subject_name: string;
    topic: string;
    question_count?: number;
    difficulty?: string;
    language?: string;
  }): Promise<{ questions: QuizQuestionItem[] }> {
    const res = await api.post('/ai/generate-quiz', params);
    return res.data;
  },

  async generateLessonPlan(params: {
    subject_name: string;
    grade_level: string;
    topic: string;
    duration_minutes?: number;
    language?: string;
  }): Promise<any> {
    const res = await api.post('/ai/lesson-plan', params);
    return res.data;
  },

  async summarizeMaterial(material_id: string, target_language: string = 'en'): Promise<any> {
    const res = await api.post('/ai/summarize', {
      material_id,
      target_language,
    });
    return res.data;
  },

  async indexDocument(material_id: string): Promise<any> {
    const res = await api.post(`/ai/index-document/${material_id}`);
    return res.data;
  },
};
