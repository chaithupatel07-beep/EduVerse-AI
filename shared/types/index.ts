/**
 * EduVerse AI - Shared Types & Interfaces
 * Core domain contracts shared across Web, Mobile, and API client layers.
 */

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  institutionId?: string;
  institutionName?: string;
  gradeLevel?: string; // For students
  subjectSpecialization?: string; // For teachers
  childIds?: string[]; // For parents (linked student IDs)
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: UserProfile;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
    dialect: string;
  };
  uptimeSeconds: number;
}
