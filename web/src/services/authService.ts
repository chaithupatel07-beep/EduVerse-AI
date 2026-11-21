import { apiClient } from './api';
import { ApiResponse, AuthResponseData, SystemHealth, UserProfile, UserRole } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', {
      email,
      password,
    });
    return response.data.data!;
  },

  async register(data: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    institution_code?: string;
    grade_level?: string;
    subject_specialization?: string;
  }): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', data);
    return response.data.data!;
  },

  async getMe(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/auth/me');
    return response.data.data!;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('eduverse_access_token');
      localStorage.removeItem('eduverse_refresh_token');
      localStorage.removeItem('eduverse_user');
    }
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.put<ApiResponse<UserProfile>>('/users/profile', updates);
    return response.data.data!;
  },

  async testRoleAccess(role: UserRole): Promise<{ user_id: string; role: string }> {
    const response = await apiClient.get<ApiResponse<{ user_id: string; role: string }>>(
      `/users/role-test/${role}`
    );
    return response.data.data!;
  },

  async checkHealth(): Promise<SystemHealth> {
    const response = await apiClient.get<SystemHealth>('/health');
    return response.data;
  },
};
