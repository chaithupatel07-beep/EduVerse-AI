import apiClient from './api';

export interface StudentTrendAnalytics {
  student_id: string;
  overall_attendance_rate: number;
  quiz_timeline: Array<{
    date: string;
    quiz_title: string;
    percentage: number;
    passed: boolean;
  }>;
  assignment_timeline: Array<{
    date: string;
    assignment_title: string;
    marks_obtained: number;
    status: string;
  }>;
  total_assessments: number;
}

export interface ClassAnalytics {
  class_id: string;
  class_name: string;
  total_students: number;
  class_average_quiz: number;
  class_average_attendance: number;
  at_risk_students: Array<{
    student_id: string;
    student_name: string;
    quiz_average: number;
    attendance_rate: number;
    primary_concern: string;
  }>;
  common_learning_gaps: Array<{
    topic_name: string;
    affected_students_count: number;
    recommended_action: string;
  }>;
}

export interface InstitutionAnalytics {
  institution_id: string;
  total_students: number;
  total_teachers: number;
  total_departments: number;
  total_courses: number;
  institution_average_score: number;
  institution_average_attendance: number;
  department_breakdown: Array<{
    department_id: string;
    name: string;
    courses_count: number;
    average_performance: number;
  }>;
}

export interface AcademicPrediction {
  student_id: string;
  model_version: string;
  predicted_gpa_range: string;
  predicted_success_score: number;
  confidence_interval: string;
  confidence_score: number;
  contributing_factors: Record<string, number>;
  suggested_interventions: string[];
  is_rule_based?: boolean;
  data_sufficiency?: 'sufficient' | 'insufficient_data' | 'no_data';
  methodology?: string;
  transparency_notice?: string;
  data_points_count?: {
    quizzes: number;
    assignments: number;
    attendance_records: number;
  };
  missing_requirements?: string[];
  created_at: string;
}

export interface MLModelStatus {
  model_name: string;
  model_version: string;
  algorithm_type: string;
  is_trained: boolean;
  metrics: {
    r2_score: number;
    rmse: number;
  };
  feature_importances: Record<string, number>;
  sample_size: number;
}

export const analyticsService = {
  async getStudentAnalytics(studentId?: string): Promise<StudentTrendAnalytics> {
    const res = await apiClient.get('/analytics/student', {
      params: studentId ? { student_id: studentId } : undefined,
    });
    return res.data;
  },

  async getClassAnalytics(classId: string): Promise<ClassAnalytics> {
    const res = await apiClient.get(`/analytics/teacher/class/${classId}`);
    return res.data;
  },

  async getInstitutionAnalytics(institutionId?: string): Promise<InstitutionAnalytics> {
    const res = await apiClient.get('/analytics/institution', {
      params: institutionId ? { institution_id: institutionId } : undefined,
    });
    return res.data;
  },

  async getStudentPrediction(studentId: string): Promise<AcademicPrediction> {
    const res = await apiClient.get(`/ml/predictions/student/${studentId}`);
    return res.data;
  },

  async getModelStatus(): Promise<MLModelStatus> {
    const res = await apiClient.get('/ml/model-status');
    return res.data;
  },
};
