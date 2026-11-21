import { mobileApi } from './api';
import {
  Course,
  EnrolledClass,
  StudyMaterial,
  Assignment,
  AssignmentSubmission,
  Quiz,
  QuizAttempt,
  AttendanceSession,
  StudentAttendanceSummary,
  StudentProgressSummary,
  InstitutionStats,
  Announcement,
  CommunicationRequest,
} from '../types';

export const educationService = {
  // ---------------- Courses & Enrollments ----------------
  async listCourses(departmentId?: string, search?: string): Promise<Course[]> {
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId);
    if (search) params.append('search', search);
    const res = await mobileApi.get<Course[]>(`/courses?${params.toString()}`);
    return res.data;
  },

  async getEnrolledClasses(studentId?: string): Promise<EnrolledClass[]> {
    const params = studentId ? `?student_id=${studentId}` : '';
    const res = await mobileApi.get<EnrolledClass[]>(`/classes/student/enrolled${params}`);
    return res.data;
  },

  async getTeacherAssignedClasses(): Promise<any[]> {
    const res = await mobileApi.get<any[]>('/classes/teacher/assigned');
    return res.data;
  },

  // ---------------- Study Materials ----------------
  async listMaterials(courseId?: string, subjectId?: string, search?: string): Promise<StudyMaterial[]> {
    const params = new URLSearchParams();
    if (courseId) params.append('course_id', courseId);
    if (subjectId) params.append('subject_id', subjectId);
    if (search) params.append('search', search);
    const res = await mobileApi.get<StudyMaterial[]>(`/materials?${params.toString()}`);
    return res.data;
  },

  // ---------------- Assignments ----------------
  async listAssignments(classId?: string, subjectId?: string): Promise<Assignment[]> {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (subjectId) params.append('subject_id', subjectId);
    const res = await mobileApi.get<Assignment[]>(`/assignments?${params.toString()}`);
    return res.data;
  },

  async getStudentSubmissions(studentId?: string): Promise<AssignmentSubmission[]> {
    const params = studentId ? `?student_id=${studentId}` : '';
    const res = await mobileApi.get<AssignmentSubmission[]>(`/assignments/submissions/my${params}`);
    return res.data;
  },

  async submitAssignment(assignmentId: string, submissionText: string): Promise<AssignmentSubmission> {
    const res = await mobileApi.post<AssignmentSubmission>(`/assignments/${assignmentId}/submit`, {
      submission_text: submissionText,
    });
    return res.data;
  },

  // ---------------- Quizzes ----------------
  async listQuizzes(classId?: string, subjectId?: string): Promise<Quiz[]> {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (subjectId) params.append('subject_id', subjectId);
    const res = await mobileApi.get<Quiz[]>(`/quizzes?${params.toString()}`);
    return res.data;
  },

  async getQuiz(quizId: string): Promise<Quiz> {
    const res = await mobileApi.get<Quiz>(`/quizzes/${quizId}`);
    return res.data;
  },

  async submitQuizAttempt(
    quizId: string,
    answers: { question_id: string; selected_option_id?: string; text_answer?: string }[]
  ): Promise<QuizAttempt> {
    const res = await mobileApi.post<QuizAttempt>(`/quizzes/${quizId}/attempt`, { answers });
    return res.data;
  },

  // ---------------- Attendance ----------------
  async getStudentAttendanceSummary(studentId?: string): Promise<StudentAttendanceSummary> {
    const params = studentId ? `?student_id=${studentId}` : '';
    const res = await mobileApi.get<StudentAttendanceSummary>(`/attendance/student/summary${params}`);
    return res.data;
  },

  async getTeacherAttendanceSessions(classId?: string): Promise<AttendanceSession[]> {
    const params = classId ? `?class_id=${classId}` : '';
    const res = await mobileApi.get<AttendanceSession[]>(`/attendance/sessions${params}`);
    return res.data;
  },

  // ---------------- Progress & Analytics ----------------
  async getStudentProgress(studentId?: string): Promise<StudentProgressSummary> {
    const params = studentId ? `?student_id=${studentId}` : '';
    const res = await mobileApi.get<StudentProgressSummary>(`/progress/student${params}`);
    return res.data;
  },

  async getInstitutionStats(): Promise<InstitutionStats> {
    const res = await mobileApi.get<InstitutionStats>('/progress/institution-stats');
    return res.data;
  },

  // ---------------- Announcements ----------------
  async listAnnouncements(targetRole?: string): Promise<Announcement[]> {
    const params = targetRole ? `?target_role=${targetRole}` : '';
    const res = await mobileApi.get<Announcement[]>(`/announcements?${params}`);
    return res.data;
  },

  // ---------------- Communications ----------------
  async listCommunications(): Promise<CommunicationRequest[]> {
    const res = await mobileApi.get<CommunicationRequest[]>('/announcements/communications');
    return res.data;
  },

  async createCommunication(payload: {
    teacher_id: string;
    student_id: string;
    subject: string;
    message: string;
  }): Promise<CommunicationRequest> {
    const res = await mobileApi.post<CommunicationRequest>('/announcements/communications', payload);
    return res.data;
  },
};
