export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export interface StudentProfileData {
  student_identifier?: string;
  department?: string;
  academic_year?: string;
  program?: string;
  gpa?: number;
}

export interface TeacherProfileData {
  employee_identifier?: string;
  department?: string;
  designation?: string;
  specialization?: string;
  office_hours?: string;
}

export interface ParentProfileData {
  contact_number?: string;
  occupation?: string;
  preferred_language: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  firebase_uid?: string | null;
  account_status?: string;
  email_verified?: boolean;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  institution_id?: string | null;
  institution_name?: string | null;
  grade_level?: string | null;
  subject_specialization?: string | null;
  child_ids?: string[] | null;
  student_profile?: StudentProfileData | null;
  teacher_profile?: TeacherProfileData | null;
  parent_profile?: ParentProfileData | null;
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

export interface ParentStudentRelationship {
  id: string;
  parent_user_id: string;
  parent_name?: string;
  parent_email?: string;
  student_user_id: string;
  student_name?: string;
  student_email?: string;
  relationship_type: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_at?: string;
  created_at: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  description?: string;
  city?: string;
  country: string;
  institution_type: string;
  verification_status: string;
  is_active: boolean;
}

export interface RegisterProfilePayload {
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  institution_code?: string;
  phone?: string;
  student_id?: string;
  department?: string;
  academic_year?: string;
  program?: string;
  employee_id?: string;
  designation?: string;
  specialization?: string;
  linked_student_email?: string;
  relationship_type?: string;
  invitation_code?: string;
}
