export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  grade_level?: string | null;
  subject_specialization?: string | null;
  institution_name?: string | null;
}

export interface AuthResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
  };
  user: UserProfile;
}
