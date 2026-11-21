import { apiClient } from './api';
import {
  ApiResponse,
  AuthResponseData,
  Institution,
  ParentStudentRelationship,
  RegisterProfilePayload,
  SystemHealth,
  UserProfile,
  UserRole,
} from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', {
      email,
      password,
    });
    return response.data.data!;
  },

  async loginWithFirebase(idToken: string, role?: UserRole, fullName?: string): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/firebase-login', {
      id_token: idToken,
      role,
      full_name: fullName,
    });
    return response.data.data!;
  },

  async verifyToken(idToken: string): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/verify-token', {
      id_token: idToken,
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

  async registerProfile(payload: RegisterProfilePayload): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register-profile', payload);
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
    const response = await apiClient.patch<ApiResponse<UserProfile>>('/users/me', updates);
    return response.data.data!;
  },

  async testRoleAccess(role: UserRole): Promise<{ user_id: string; role: string }> {
    const response = await apiClient.get<ApiResponse<{ user_id: string; role: string }>>(
      `/users/role-test/${role}`
    );
    return response.data.data!;
  },

  async getInstitutions(): Promise<Institution[]> {
    const response = await apiClient.get<ApiResponse<Institution[]>>('/institutions');
    return response.data.data || [];
  },

  async requestParentStudentLink(
    studentEmail: string,
    relationshipType: string = 'guardian',
    notes?: string
  ): Promise<ParentStudentRelationship> {
    const response = await apiClient.post<ApiResponse<ParentStudentRelationship>>(
      '/relationships/parent-student/request',
      {
        student_email: studentEmail,
        relationship_type: relationshipType,
        notes,
      }
    );
    return response.data.data!;
  },

  async verifyParentStudentLink(
    relationshipId: string,
    decision: 'verified' | 'rejected'
  ): Promise<ParentStudentRelationship> {
    const response = await apiClient.post<ApiResponse<ParentStudentRelationship>>(
      '/relationships/parent-student/verify',
      {
        relationship_id: relationshipId,
        decision,
      }
    );
    return response.data.data!;
  },

  async getRelationships(): Promise<ParentStudentRelationship[]> {
    const response = await apiClient.get<ApiResponse<ParentStudentRelationship[]>>(
      '/relationships/parent-student'
    );
    return response.data.data || [];
  },

  async getMyChildren(): Promise<UserProfile[]> {
    const response = await apiClient.get<ApiResponse<UserProfile[]>>(
      '/relationships/parent-student/my-children'
    );
    return response.data.data || [];
  },

  async checkHealth(): Promise<SystemHealth> {
    const response = await apiClient.get<SystemHealth>('/health');
    return response.data;
  },
};
