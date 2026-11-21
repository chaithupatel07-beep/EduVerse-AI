/**
 * EduVerse AI - Teacher AI Copilot Service (Phase 6)
 * Typed client for 11-section lesson plans, question papers, teaching materials,
 * remedial guidance, and AI-assisted evaluation review safeguards.
 */
import api from './api';

export interface LessonPlanSection {
  title: string;
  duration_minutes?: number;
  content: string;
  teacher_tips?: string[];
}

export interface LessonPlan {
  id: string;
  subject: string;
  grade_level: string;
  topic: string;
  duration_minutes: number;
  learning_level: string;
  language: string;
  status: 'draft' | 'reviewed' | 'approved' | 'published';
  content: {
    prerequisites?: string[];
    learning_objectives?: string[];
    instructional_materials?: string[];
    lesson_introduction?: string;
    core_concept_delivery?: string;
    active_learning_activity?: string;
    scaffolded_guided_practice?: string;
    independent_practice?: string;
    formative_check_for_understanding?: string;
    differentiation_and_accessibility?: {
      struggling_learners?: string;
      advanced_learners?: string;
      ell_support?: string;
    };
    closure_and_homework?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface QuestionPaperSection {
  section_name: string;
  section_title?: string;
  marks_per_question: number;
  question_type: string;
  questions: Array<{
    question_number: number;
    question_text: string;
    options?: string[];
    marks: number;
    bloom_level?: string;
  }>;
}

export interface QuestionPaper {
  id: string;
  title: string;
  subject: string;
  grade_level: string;
  total_marks: number;
  duration_minutes: number;
  difficulty_mix: { easy: number; medium: number; hard: number };
  instructions: string[];
  sections: QuestionPaperSection[];
  answer_key?: Array<{
    question_number: number;
    correct_answer: string;
    step_by_step_solution?: string;
    marking_rubric?: string;
  }>;
  status: 'draft' | 'approved' | 'published';
  created_at: string;
}

export interface TeachingMaterialResult {
  topic: string;
  subject: string;
  grade_level: string;
  executive_summary: string;
  classroom_analogies: Array<{
    analogy_title: string;
    everyday_concept: string;
    academic_connection: string;
  }>;
  common_misconceptions: Array<{
    misconception: string;
    scientific_correction: string;
    remedial_question: string;
  }>;
  differentiated_explanations: {
    intuitive_beginner: string;
    standard_curriculum: string;
    advanced_deep_dive: string;
  };
  multimedia_recommendations: string[];
}

export interface RemedialGuidanceResult {
  class_id: string;
  subject: string;
  total_identified_gaps: number;
  struggling_topics: Array<{
    topic: string;
    affected_students_count: number;
    recommended_reteaching_strategy: string;
  }>;
  differentiated_student_groups: Array<{
    group_name: string;
    target_concept: string;
    recommended_activity: string;
  }>;
  next_step_action_plan: string[];
}

export interface EvaluationSuggestion {
  id: string;
  submission_id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  assignment_title: string;
  suggested_marks: number;
  max_marks: number;
  confidence_score: number;
  correct_concepts: string[];
  missing_points: string[];
  constructive_feedback: string;
  revision_suggestions: string[];
  status: 'suggested' | 'approved' | 'modified' | 'rejected';
  teacher_approved_marks?: number;
  teacher_final_feedback?: string;
  submission_text?: string;
}

export const teacherAiService = {
  // Lesson Plans
  async generateLessonPlan(params: {
    subject: string;
    grade: string;
    topic: string;
    duration?: number;
    learning_level?: string;
    objectives?: string[];
    language?: string;
  }): Promise<LessonPlan> {
    const res = await api.post('/teacher/ai/lesson-plan', params);
    return res.data;
  },

  async listLessonPlans(): Promise<LessonPlan[]> {
    const res = await api.get('/teacher/ai/lesson-plans');
    return res.data;
  },

  async updateLessonPlan(id: string, data: { content?: any; status?: string }): Promise<LessonPlan> {
    const res = await api.put(`/teacher/ai/lesson-plan/${id}`, data);
    return res.data;
  },

  async publishLessonPlan(id: string): Promise<LessonPlan> {
    const res = await api.post(`/teacher/ai/lesson-plan/${id}/publish`);
    return res.data;
  },

  // Question Papers
  async generateQuestionPaper(params: {
    subject: string;
    grade: string;
    topic: string;
    total_marks?: number;
    duration_minutes?: number;
    difficulty_mix?: { easy: number; medium: number; hard: number };
    include_answer_key?: boolean;
    language?: string;
  }): Promise<QuestionPaper> {
    const res = await api.post('/teacher/ai/question-paper', params);
    return res.data;
  },

  async listQuestionPapers(): Promise<QuestionPaper[]> {
    const res = await api.get('/teacher/ai/question-papers');
    return res.data;
  },

  async getQuestionPaper(id: string): Promise<QuestionPaper> {
    const res = await api.get(`/teacher/ai/question-paper/${id}`);
    return res.data;
  },

  async updateQuestionPaper(id: string, data: { status?: string; sections?: any; answer_key?: any }): Promise<QuestionPaper> {
    const res = await api.put(`/teacher/ai/question-paper/${id}`, data);
    return res.data;
  },

  // Teaching Material & Remedial Guidance
  async generateTeachingMaterials(params: {
    subject: string;
    grade: string;
    topic: string;
    language?: string;
  }): Promise<TeachingMaterialResult> {
    const res = await api.post('/teacher/ai/teaching-materials', params);
    return res.data;
  },

  async generateRemedialGuidance(classId: string, subject?: string): Promise<RemedialGuidanceResult> {
    const res = await api.post('/teacher/ai/remedial-guidance', { class_id: classId, subject });
    return res.data;
  },

  // AI-Assisted Evaluation (Teacher Safeguard)
  async getEvaluationSuggestion(submissionId: string): Promise<EvaluationSuggestion> {
    const res = await api.post(`/teacher/ai/evaluate-submission/${submissionId}`);
    return res.data;
  },

  async approveEvaluation(submissionId: string, params: {
    decision: 'approved' | 'modified' | 'rejected';
    teacher_approved_marks: number;
    teacher_final_feedback: string;
  }): Promise<any> {
    const res = await api.post(`/teacher/ai/approve-evaluation/${submissionId}`, params);
    return res.data;
  },
};

export default teacherAiService;
