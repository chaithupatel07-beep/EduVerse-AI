/**
 * EduVerse AI - Notification Service (Phase 6)
 * Real-time in-app notifications, badge count, mark-read, and alert preferences.
 */
import api from './api';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'academic' | 'assignment' | 'attendance' | 'meeting' | 'system' | 'alert';
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  in_app_notifications: boolean;
  assignment_alerts: boolean;
  attendance_alerts: boolean;
  meeting_alerts: boolean;
  preferred_language: 'en' | 'te' | 'hi';
}

export const notificationService = {
  async getNotifications(unreadOnly = false, limit = 30): Promise<NotificationItem[]> {
    const res = await api.get(`/notifications?unread_only=${unreadOnly}&limit=${limit}`);
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get('/notifications/unread-count');
    return res.data.unread_count;
  },

  async markRead(notificationId: string): Promise<void> {
    await api.put(`/notifications/${notificationId}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.put('/notifications/mark-all-read');
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const res = await api.get('/notifications/preferences');
    return res.data;
  },

  async updatePreferences(params: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const res = await api.put('/notifications/preferences', params);
    return res.data;
  },
};

export default notificationService;
