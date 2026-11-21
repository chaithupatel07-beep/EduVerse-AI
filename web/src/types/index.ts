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


// Phase 3: Academic Management Types
export interface Subject {
  id: string;
  course_id: string;
  title: string;
  code: string;
  description?: string;
  order_index: number;
  created_at: string;
}

export interface Course {
  id: string;
  institution_id: string;
  department_id?: string;
  title: string;
  code: string;
  description?: string;
  credits: number;
  syllabus?: string;
  cover_image_url?: string;
  is_active: boolean;
  subjects?: Subject[];
  created_at: string;
  updated_at: string;
}

export interface ClassRoom {
  id: string;
  institution_id: string;
  course_id: string;
  course_title?: string;
  course_code?: string;
  name: string;
  academic_year: string;
  semester_term: string;
  room_number?: string;
  schedule?: string;
  is_active: boolean;
  enrolled_count?: number;
  created_at: string;
}

export interface EnrolledClass {
  enrollment_id: string;
  class_id: string;
  class_name: string;
  academic_year: string;
  semester_term: string;
  schedule?: string;
  room_number?: string;
  course_id: string;
  course_title: string;
  course_code: string;
  credits: number;
  description?: string;
}

export interface StudyMaterial {
  id: string;
  institution_id: string;
  course_id: string;
  course_title?: string;
  subject_id?: string;
  subject_title?: string;
  uploaded_by: string;
  uploader_name?: string;
  title: string;
  description?: string;
  file_name: string;
  original_file_name: string;
  file_size: number;
  mime_type: string;
  file_type: string;
  download_count: number;
  is_published: boolean;
  rag_indexed: boolean;
  rag_chunks_count: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  institution_id: string;
  class_id: string;
  class_name?: string;
  subject_id?: string;
  subject_title?: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  description: string;
  instructions?: string;
  max_marks: number;
  due_date: string;
  allowed_formats: string;
  attachment_url?: string;
  status: 'draft' | 'published' | 'archived';
  total_submissions?: number;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  assignment_title?: string;
  max_marks?: number;
  student_id: string;
  student_name?: string;
  student_email?: string;
  submission_text?: string;
  file_name?: string;
  file_size?: number;
  status: 'submitted' | 'late' | 'under_evaluation' | 'evaluated';
  submitted_at: string;
  marks_obtained?: number;
  feedback?: string;
  evaluated_by?: string;
  evaluator_name?: string;
  evaluated_at?: string;
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct?: boolean | null;
  order_index: number;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'mcq' | 'multi_select' | 'true_false' | 'short_answer';
  points: number;
  order_index: number;
  explanation?: string;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  institution_id: string;
  class_id: string;
  class_name?: string;
  subject_id?: string;
  subject_title?: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  description?: string;
  instructions?: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  is_published: boolean;
  results_released: boolean;
  total_questions?: number;
  questions?: QuizQuestion[];
  created_at: string;
}

export interface QuizAttemptAnswer {
  question_id: string;
  question_text: string;
  question_type: string;
  points: number;
  selected_option_id?: string;
  text_answer?: string;
  is_correct: boolean;
  marks_awarded: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title?: string;
  student_id: string;
  student_name?: string;
  status: string;
  score: number;
  percentage: number;
  passed: boolean;
  started_at: string;
  submitted_at?: string;
  results_released?: boolean;
  answers?: QuizAttemptAnswer[];
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  session_date?: string;
  session_title?: string;
  recorded_at: string;
}

export interface AttendanceSession {
  id: string;
  institution_id: string;
  class_id: string;
  class_name?: string;
  subject_id?: string;
  subject_title?: string;
  teacher_id: string;
  teacher_name?: string;
  session_date: string;
  session_title: string;
  session_notes?: string;
  total_records: number;
  present_count: number;
  absent_count: number;
  records?: AttendanceRecord[];
  created_at: string;
}

export interface StudentAttendanceSummary {
  student_id: string;
  student_name: string;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_percentage: number;
  records: AttendanceRecord[];
}

export interface SubjectProgress {
  subject_id: string;
  subject_title: string;
  course_title: string;
  total_assignments: number;
  submitted_assignments: number;
  evaluated_assignments: number;
  average_assignment_score: number;
  total_quizzes: number;
  attempted_quizzes: number;
  average_quiz_score: number;
  attendance_rate: number;
}

export interface StudentProgressSummary {
  student_id: string;
  student_name: string;
  student_identifier?: string;
  institution_id?: string;
  enrolled_courses_count: number;
  overall_attendance_rate: number;
  assignment_completion_rate: number;
  quiz_average_score: number;
  overall_academic_score: number;
  subjects_progress: SubjectProgress[];
}

export interface InstitutionStats {
  institution_id: string;
  institution_name: string;
  total_students: number;
  total_teachers: number;
  total_parents: number;
  total_courses: number;
  total_classes: number;
  total_subjects: number;
  active_assignments: number;
  published_quizzes: number;
  average_attendance_rate: number;
}

export interface Announcement {
  id: string;
  institution_id: string;
  author_id: string;
  author_name?: string;
  title: string;
  content: string;
  target_role: 'all' | 'student' | 'teacher' | 'parent';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_published: boolean;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface CommunicationRequest {
  id: string;
  parent_id: string;
  parent_name?: string;
  teacher_id: string;
  teacher_name?: string;
  student_id: string;
  student_name?: string;
  subject: string;
  message: string;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  response_notes?: string;
  created_at: string;
  updated_at: string;
}
