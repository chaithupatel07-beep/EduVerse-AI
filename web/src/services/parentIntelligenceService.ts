/**
 * EduVerse AI - Parent Intelligence Service (Phase 6)
 * Typed client for verified Parent Progress Reports (EN, TE, HI)
 * and Parent–Teacher Consultation Meetings with video integration.
 */
import api from './api';

export interface ParentProgressReport {
  id: string;
  student_id: string;
  student_name: string;
  report_type: 'weekly_summary' | 'monthly_deep_dive' | 'attendance_alert' | 'exam_readiness';
  language: 'en' | 'te' | 'hi';
  summary_text: string;
  strengths: string[];
  improvements_needed: string[];
  parental_support_recommendations: string[];
  metrics_snapshot: {
    attendance_rate?: number;
    quiz_average?: number;
    assignment_completion_rate?: number;
    active_knowledge_gaps_count?: number;
    [key: string]: any;
  };
  created_at: string;
}

export interface MeetingRequest {
  id: string;
  parent_id: string;
  parent_name?: string;
  teacher_id: string;
  teacher_name?: string;
  student_id: string;
  student_name?: string;
  institution_id: string;
  requested_date: string;
  preferred_time_slot: string;
  subject: string;
  reason: string;
  meeting_type: 'in_person' | 'online_video' | 'phone_call';
  status: 'requested' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';
  teacher_notes?: string;
  meeting_link?: string;
  created_at: string;
  updated_at: string;
}

export const parentIntelligenceService = {
  // Parent Reports
  async generateReport(params: {
    student_id: string;
    report_type?: 'weekly_summary' | 'monthly_deep_dive' | 'attendance_alert' | 'exam_readiness';
    language?: 'en' | 'te' | 'hi';
  }): Promise<ParentProgressReport> {
    const res = await api.post('/parent/reports/generate', params);
    return res.data;
  },

  async listReports(studentId: string): Promise<ParentProgressReport[]> {
    const res = await api.get(`/parent/reports/${studentId}`);
    return res.data;
  },

  // Consultation Meetings
  async requestMeeting(params: {
    teacher_id: string;
    student_id: string;
    requested_date: string;
    preferred_time_slot: string;
    subject: string;
    reason: string;
    meeting_type?: 'in_person' | 'online_video' | 'phone_call';
  }): Promise<MeetingRequest> {
    const res = await api.post('/parent/meetings/request', params);
    return res.data;
  },

  async listMeetings(statusFilter?: string): Promise<MeetingRequest[]> {
    const url = statusFilter
      ? `/communication/meetings?status_filter=${statusFilter}`
      : '/communication/meetings';
    const res = await api.get(url);
    return res.data;
  },

  async updateMeetingStatus(
    meetingId: string,
    params: {
      status: 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';
      teacher_notes?: string;
      meeting_link?: string;
      new_date?: string;
      new_time_slot?: string;
    }
  ): Promise<MeetingRequest> {
    const res = await api.put(`/communication/meetings/${meetingId}/status`, params);
    return res.data;
  },
};

export default parentIntelligenceService;
