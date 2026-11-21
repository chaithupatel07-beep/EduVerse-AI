/**
 * EduVerse AI - Admin Intelligence Service (Phase 6)
 * Communication resolution analytics, staff request assignment,
 * and automated institutional reports generation.
 */
import api from './api';

export interface CommunicationAnalytics {
  institution_id: string;
  total_inquiries: number;
  open_count: number;
  assigned_count: number;
  in_progress_count: number;
  resolved_count: number;
  resolution_rate_percent: number;
  category_distribution: Record<string, number>;
  average_resolution_hours: number;
  staff_workload: Array<{
    staff_id: string;
    staff_name: string;
    assigned_count: number;
  }>;
}

export interface InstitutionalReport {
  id: string;
  title: string;
  report_type: 'monthly_academic_health' | 'department_comparison' | 'attendance_retention' | 'knowledge_gap_summary';
  department_id?: string;
  department_name?: string;
  summary_metrics: {
    total_students?: number;
    campus_average_attendance?: number;
    campus_average_quiz_score?: number;
    total_active_knowledge_gaps?: number;
    departments_monitored?: number;
    [key: string]: any;
  };
  department_breakdown: Array<{
    department_name: string;
    total_courses: number;
    active_students: number;
    average_attendance: number;
    average_quiz_score: number;
    risk_level: string;
  }>;
  curriculum_recommendations: string[];
  created_at: string;
}

export const adminIntelligenceService = {
  async getCommunicationAnalytics(): Promise<CommunicationAnalytics> {
    const res = await api.get('/admin/communication/analytics');
    return res.data;
  },

  async assignStaff(requestId: string, assignedToId: string, notes?: string): Promise<any> {
    const res = await api.put(`/admin/communication/requests/${requestId}/assign`, {
      assigned_to_id: assignedToId,
      assignment_notes: notes,
    });
    return res.data;
  },

  async generateInstitutionalReport(params: {
    report_type: 'monthly_academic_health' | 'department_comparison' | 'attendance_retention' | 'knowledge_gap_summary';
    department_id?: string;
    timeframe_days?: number;
  }): Promise<InstitutionalReport> {
    const res = await api.post('/admin/reports/generate', params);
    return res.data;
  },

  async listInstitutionalReports(reportType?: string): Promise<InstitutionalReport[]> {
    const url = reportType ? `/admin/reports?report_type=${reportType}` : '/admin/reports';
    const res = await api.get(url);
    return res.data;
  },
};

export default adminIntelligenceService;
