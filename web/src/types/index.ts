export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  institution_id?: string | null;
  institution_name?: string | null;
  grade_level?: string | null;
  subject_specialization?: string | null;
  child_ids?: string[] | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponseData {
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
  status: string;
  version: string;
  environment: string;
  database: {
    status: string;
    dialect: string;
  };
  timestamp: string;
}
