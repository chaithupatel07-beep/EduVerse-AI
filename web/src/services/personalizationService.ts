import apiClient from './api';

export interface LearningProfile {
  student_id: string;
  student_name: string;
  overall_gpa: number;
  quiz_average: number;
  assignment_average: number;
  attendance_rate: number;
  quizzes_completed: number;
  assignments_completed: number;
  learning_streak_days: number;
  learning_pace: string;
  subject_performance: Record<string, { score: number; status: string }>;
  topic_strengths: string[];
  topic_weaknesses: string[];
  learning_goals: Array<{ goal: string; progress_pct: number; target_date: string }>;
  recommended_focus_areas: string[];
  last_analyzed_at: string;
}

export interface KnowledgeGap {
  id: string;
  subject_id: string;
  subject_name?: string;
  topic_name: string;
  classification:
    | 'strong_understanding'
    | 'good_understanding'
    | 'needs_improvement'
    | 'requires_immediate_revision'
    | 'insufficient_assessment_data';
  confidence_score: number;
  evidence_summary: string;
  root_cause_reason?: string;
  suggested_action: string;
  related_material_id?: string;
  is_resolved: boolean;
  accuracy_percentage: number;
  last_assessment_date?: string;
}

export interface StudyPlanActivity {
  id: string;
  topic_name: string;
  activity_type: string;
  title: string;
  instructions?: string;
  priority: 'high' | 'medium' | 'low';
  estimated_duration_minutes: number;
  recommended_material_id?: string;
  recommended_material_title?: string;
  is_completed: boolean;
  completed_at?: string;
  order_index: number;
}

export interface StudyPlan {
  id: string;
  title: string;
  learning_objective: string;
  target_start_date: string;
  target_end_date: string;
  total_estimated_minutes: number;
  completion_percentage: number;
  status: string;
  activities: StudyPlanActivity[];
  created_at: string;
}

export interface ResourceRecommendation {
  id: string;
  material_id: string;
  material_title: string;
  file_type: string;
  file_path: string;
  download_count: number;
  recommendation_reason: string;
  confidence_score: number;
  created_at: string;
}

export const personalizationService = {
  async getLearningProfile(studentId?: string): Promise<LearningProfile> {
    const res = await apiClient.get('/learning/profile', {
      params: studentId ? { student_id: studentId } : undefined,
    });
    return res.data;
  },

  async getKnowledgeGaps(studentId?: string): Promise<KnowledgeGap[]> {
    const res = await apiClient.get('/learning/knowledge-gaps', {
      params: studentId ? { student_id: studentId } : undefined,
    });
    return res.data;
  },

  async listStudyPlans(studentId?: string): Promise<any[]> {
    const res = await apiClient.get('/learning/study-plans', {
      params: studentId ? { student_id: studentId } : undefined,
    });
    return res.data;
  },

  async getStudyPlanDetails(planId: string): Promise<StudyPlan> {
    const res = await apiClient.get(`/learning/study-plans/${planId}`);
    return res.data;
  },

  async generateStudyPlan(customGoal?: string, durationDays: number = 7): Promise<StudyPlan> {
    const res = await apiClient.post('/learning/study-plans/generate', {
      custom_goal: customGoal,
      duration_days: durationDays,
    });
    return res.data;
  },

  async updateActivityStatus(activityId: string, isCompleted: boolean): Promise<any> {
    const res = await apiClient.put(`/learning/study-plans/activities/${activityId}/status`, {
      is_completed: isCompleted,
    });
    return res.data;
  },

  async getRecommendations(studentId?: string): Promise<ResourceRecommendation[]> {
    const res = await apiClient.get('/learning/recommendations', {
      params: studentId ? { student_id: studentId } : undefined,
    });
    return res.data;
  },

  async submitRecommendationFeedback(
    recommendationId: string,
    isHelpful: boolean,
    comments?: string
  ): Promise<any> {
    const res = await apiClient.post('/learning/recommendations/feedback', {
      recommendation_id: recommendationId,
      is_helpful: isHelpful,
      comments,
    });
    return res.data;
  },

  async startAdaptiveSession(subjectId: string, topicName: string): Promise<any> {
    const res = await apiClient.post('/learning/adaptive/session', {
      subject_id: subjectId,
      topic_name: topicName,
    });
    return res.data;
  },

  async submitAdaptiveSession(sessionId: string, answers: Record<string, number>): Promise<any> {
    const res = await apiClient.post('/learning/adaptive/submit', {
      session_id: sessionId,
      answers,
    });
    return res.data;
  },
};
