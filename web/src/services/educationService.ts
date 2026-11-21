import { apiClient } from './api';
import {
  Course,
  Subject,
  ClassRoom,
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
  NotificationItem,
  CommunicationRequest,
} from '../types';

export const educationService = {
  // ---------------- Courses & Subjects ----------------
  async listCourses(departmentId?: string, search?: string): Promise<Course[]> {
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId);
    if (search) params.append('search', search);
    const res = await apiClient.get<Course[]>(`/courses?${params.toString()}`);
    return res.data;
  },

  async getCourse(courseId: string): Promise<Course> {
    const res = await apiClient.get<Course>(`/courses/${courseId}`);
    return res.data;
  },

  async createCourse(payload: {
    title: string;
    code: string;
    description?: string;
    credits: number;
    department_id?: string;
  }): Promise<Course> {
    const res = await apiClient.post<Course>('/courses', payload);
    return res.data;
  },

  async createSubject(payload: {
    course_id: string;
    title: string;
    code: string;
    description?: string;
    order_index?: number;
  }): Promise<Subject> {
    const res = await apiClient.post<Subject>('/subjects', payload);
    return res.data;
  },

  // ---------------- Classrooms & Enrollments ----------------
  async listClassrooms(courseId?: string): Promise<ClassRoom[]> {
    const params = courseId ? `?course_id=${courseId}` : '';
    const res = await apiClient.get<ClassRoom[]>(`/classes${params}`);
    return res.data;
  },

  async createClassroom(payload: {
    course_id: string;
    name: string;
    academic_year?: string;
    semester_term?: string;
    room_number?: string;
    schedule?: string;
  }): Promise<ClassRoom> {
    const res = await apiClient.post<ClassRoom>('/classes', payload);
    return res.data;
  },

  async getEnrolledClasses(studentId?: string): Promise<EnrolledClass[]> {
    const params = studentId ? `?student_id=${studentId}` : '';
    const res = await apiClient.get<EnrolledClass[]>(`/classes/student/enrolled${params}`);
    return res.data;
  },

  async getTeacherAssignedClasses(): Promise<any[]> {
    const res = await apiClient.get<any[]>('/classes/teacher/assigned');
    return res.data;
  },

  async enrollStudent(classId: string, studentId: string): Promise<any> {
    const res = await apiClient.post(`/classes/${classId}/enroll`, { student_id: studentId });
    return res.data;
  },

  async getClassStudents(classId: string): Promise<any[]> {
    const res = await apiClient.get<any[]>(`/classes/${classId}/students`);
    return res.data;
  },

  // ---------------- Study Materials ----------------
  async listMaterials(courseId?: string, subjectId?: string, search?: string): Promise<StudyMaterial[]> {
    const params = new URLSearchParams();
    if (courseId) params.append('course_id', courseId);
    if (subjectId) params.append('subject_id', subjectId);
    if (search) params.append('search', search);
    const res = await apiClient.get<StudyMaterial[]>(`/materials?${params.toString()}`);
    return res.data;
  },

  async uploadMaterial(formData: FormData): Promise<StudyMaterial> {
    const res = await apiClient.post<StudyMaterial>('/materials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async downloadMaterial(materialId: string, originalFileName: string): Promise<void> {
    const res = await apiClient.get(`/materials/${materialId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', originalFileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async deleteMaterial(materialId: string): Promise<void> {
    await apiClient.delete(`/materials/${materialId}`);
  },

  // ---------------- Assignments ----------------
  async listAssignments(classId?: string): Promise<Assignment[]> {
    const params = classId ? `?class_id=${classId}` : '';
    const res = await apiClient.get<Assignment[]>(`/assignments${params}`);
    return res.data;
  },

  async getAssignment(assignmentId: string): Promise<Assignment> {
    const res = await apiClient.get<Assignment>(`/assignments/${assignmentId}`);
    return res.data;
  },

  async createAssignment(payload: {
    class_id: string;
    subject_id?: string;
    title: string;
    description: string;
    instructions?: string;
    max_marks: number;
    due_date: string;
    allowed_formats?: string;
    status?: string;
  }): Promise<Assignment> {
    const res = await apiClient.post<Assignment>('/assignments', payload);
    return res.data;
  },

  async submitAssignment(assignmentId: string, formData: FormData): Promise<AssignmentSubmission> {
    const res = await apiClient.post<AssignmentSubmission>(
      `/assignments/${assignmentId}/submit`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  async listAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    const res = await apiClient.get<AssignmentSubmission[]>(`/assignments/${assignmentId}/submissions`);
    return res.data;
  },

  async evaluateSubmission(
    submissionId: string,
    payload: { marks_obtained: number; feedback?: string }
  ): Promise<AssignmentSubmission> {
    const res = await apiClient.post<AssignmentSubmission>(
      `/assignments/submissions/${submissionId}/evaluate`,
      payload
    );
    return res.data;
  },

  async getMySubmissions(studentId?: string): Promise<AssignmentSubmission[]> {
    const params = studentId ? `?student_id=${studentId}` : '';
    const res = await apiClient.get<AssignmentSubmission[]>(`/assignments/submissions/my${params}`);
    return res.data;
  },

  async getStudentSubmissions(studentId: string): Promise<AssignmentSubmission[]> {
    const res = await apiClient.get<AssignmentSubmission[]>(`/assignments/submissions/my?student_id=${studentId}`);
    return res.data;
  },

  // ---------------- Quizzes ----------------
  async listQuizzes(classId?: string): Promise<Quiz[]> {
    const params = classId ? `?class_id=${classId}` : '';
    const res = await apiClient.get<Quiz[]>(`/quizzes${params}`);
    return res.data;
  },

  async getQuizDetails(quizId: string): Promise<Quiz> {
    const res = await apiClient.get<Quiz>(`/quizzes/${quizId}`);
    return res.data;
  },

  async createQuiz(payload: any): Promise<Quiz> {
    const res = await apiClient.post<Quiz>('/quizzes', payload);
    return res.data;
  },

  async submitQuizAttempt(
    quizId: string,
    answers: Array<{
      question_id: string;
      selected_option_id?: string;
      text_answer?: string;
    }>
  ): Promise<QuizAttempt> {
    const res = await apiClient.post<QuizAttempt>(`/quizzes/${quizId}/submit`, { answers });
    return res.data;
  },

  // ---------------- Attendance ----------------
  async listClassAttendanceSessions(classId: string): Promise<AttendanceSession[]> {
    const res = await apiClient.get<AttendanceSession[]>(`/attendance/sessions/class/${classId}`);
    return res.data;
  },

  async getAttendanceSession(sessionId: string): Promise<AttendanceSession> {
    const res = await apiClient.get<AttendanceSession>(`/attendance/sessions/${sessionId}`);
    return res.data;
  },

  async createAttendanceSession(payload: {
    class_id: string;
    subject_id?: string;
    session_date: string;
    session_title: string;
    session_notes?: string;
    records: Array<{ student_id: string; status: string; remarks?: string }>;
  }): Promise<AttendanceSession> {
    const res = await apiClient.post<AttendanceSession>('/attendance/sessions', payload);
    return res.data;
  },

  async getStudentAttendanceSummary(studentId: string): Promise<StudentAttendanceSummary> {
    const res = await apiClient.get<StudentAttendanceSummary>(`/attendance/student/${studentId}`);
    return res.data;
  },

  async getMyAttendanceSummary(): Promise<StudentAttendanceSummary> {
    const res = await apiClient.get<StudentAttendanceSummary>('/attendance/my-summary');
    return res.data;
  },

  // ---------------- Academic Progress ----------------
  async getMyProgress(): Promise<StudentProgressSummary> {
    const res = await apiClient.get<StudentProgressSummary>('/progress/my-progress');
    return res.data;
  },

  async getStudentProgress(studentId: string): Promise<StudentProgressSummary> {
    const res = await apiClient.get<StudentProgressSummary>(`/progress/student/${studentId}`);
    return res.data;
  },

  async getInstitutionStats(): Promise<InstitutionStats> {
    const res = await apiClient.get<InstitutionStats>('/progress/institution-stats');
    return res.data;
  },

  // ---------------- Announcements ----------------
  async listAnnouncements(targetRole?: string): Promise<Announcement[]> {
    const params = targetRole ? `?target_role=${targetRole}` : '';
    const res = await apiClient.get<Announcement[]>(`/announcements${params}`);
    return res.data;
  },

  async createAnnouncement(payload: {
    title: string;
    content: string;
    target_role?: string;
    priority?: string;
  }): Promise<Announcement> {
    const res = await apiClient.post<Announcement>('/announcements', payload);
    return res.data;
  },

  // ---------------- Notifications ----------------
  async listNotifications(unreadOnly = false): Promise<NotificationItem[]> {
    const params = unreadOnly ? '?unread_only=true' : '';
    const res = await apiClient.get<NotificationItem[]>(`/notifications${params}`);
    return res.data;
  },

  async markNotificationRead(notificationId: string): Promise<NotificationItem> {
    const res = await apiClient.put<NotificationItem>(`/notifications/${notificationId}/read`);
    return res.data;
  },

  // ---------------- Parent Communication Requests ----------------
  async listCommunicationRequests(): Promise<CommunicationRequest[]> {
    const res = await apiClient.get<CommunicationRequest[]>('/communication-requests');
    return res.data;
  },

  async createCommunicationRequest(payload: {
    teacher_id: string;
    student_id: string;
    subject: string;
    message: string;
  }): Promise<CommunicationRequest> {
    const res = await apiClient.post<CommunicationRequest>('/communication-requests', payload);
    return res.data;
  },

  async respondToCommunicationRequest(
    requestId: string,
    payload: { status: string; response_notes?: string }
  ): Promise<CommunicationRequest> {
    const res = await apiClient.put<CommunicationRequest>(
      `/communication-requests/${requestId}/respond`,
      payload
    );
    return res.data;
  },
};
