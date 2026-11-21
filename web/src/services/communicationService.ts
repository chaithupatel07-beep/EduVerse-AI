/**
 * EduVerse AI - Frontend Communication Hub Service (Phase 4)
 * Parent-Teacher-Management threaded messaging & on-demand translation
 */
import api from './api';

export interface CommunicationMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: string;
  sender_name?: string;
  content: string;
  original_language: string;
  translated_content?: string;
  target_language?: string;
  is_read: boolean;
  created_at: string;
}

export interface CommunicationThread {
  id: string;
  institution_id: string;
  thread_type: 'parent_teacher' | 'parent_management';
  category: string;
  parent_id: string;
  parent_name?: string;
  student_id?: string;
  student_name?: string;
  recipient_id?: string;
  recipient_name?: string;
  subject: string;
  status: 'pending' | 'in_review' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  messages: CommunicationMessage[];
  unread_count: number;
}

export const communicationService = {
  async listThreads(params?: { thread_type?: string; status_filter?: string }): Promise<CommunicationThread[]> {
    const res = await api.get<CommunicationThread[]>('/communication/threads', { params });
    return res.data;
  },

  async getThread(id: string): Promise<CommunicationThread> {
    const res = await api.get<CommunicationThread>(`/communication/threads/${id}`);
    return res.data;
  },

  async createThread(data: {
    thread_type: string;
    category: string;
    student_id?: string;
    recipient_id?: string;
    subject: string;
    initial_message: string;
    language?: string;
    priority?: string;
  }): Promise<CommunicationThread> {
    const res = await api.post<CommunicationThread>('/communication/threads', data);
    return res.data;
  },

  async sendMessage(thread_id: string, content: string, language: string = 'en'): Promise<CommunicationMessage> {
    const res = await api.post<CommunicationMessage>(`/communication/threads/${thread_id}/messages`, {
      content,
      original_language: language,
    });
    return res.data;
  },

  async updateThreadStatus(thread_id: string, status: string): Promise<CommunicationThread> {
    const res = await api.patch<CommunicationThread>(`/communication/threads/${thread_id}/status`, { status });
    return res.data;
  },

  async translateText(text: string, target_language: string): Promise<{ translated_text: string }> {
    const res = await api.post<{ translated_text: string }>('/communication/translate', {
      text,
      target_language,
    });
    return res.data;
  },
};
