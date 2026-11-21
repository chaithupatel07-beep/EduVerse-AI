import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { educationService } from '../../services/educationService';
import { aiService } from '../../services/aiService';
import { communicationService, CommunicationThread } from '../../services/communicationService';
import { languageService } from '../../services/languageService';
import { analyticsService, ClassAnalytics } from '../../services/analyticsService';
import {
  ClassRoom,
  Course,
  StudyMaterial,
  Assignment,
  AssignmentSubmission,
  Quiz,
  Announcement,
} from '../../types';
import {
  Users,
  BookOpen,
  FileText,
  FileCheck2,
  Calendar,
  CheckCircle2,
  Upload,
  Plus,
  X,
  Megaphone,
  Check,
  Award,
  Layers,
  Sparkles,
  Bot,
  Send,
  MessageSquare,
  Globe,
  Clock,
  RefreshCw,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Target,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'classes' | 'class_analytics' | 'ai_copilot' | 'parent_inquiries' | 'materials' | 'assignments' | 'quizzes' | 'attendance' | 'announcements'
  >('classes');
  const [isLoading, setIsLoading] = useState(true);

  // Phase 5: Class Learning Intelligence State
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics | null>(null);
  const [isLoadingClassAnalytics, setIsLoadingClassAnalytics] = useState(false);

  // AI Copilot States
  const [lessonSubject, setLessonSubject] = useState('');
  const [lessonGrade, setLessonGrade] = useState('Grade 10');
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonDuration, setLessonDuration] = useState(45);
  const [lessonLanguage, setLessonLanguage] = useState(languageService.getCurrentLanguage());
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState<any | null>(null);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);

  // Parent Inquiries State
  const [parentThreads, setParentThreads] = useState<CommunicationThread[]>([]);
  const [selectedParentThread, setSelectedParentThread] = useState<CommunicationThread | null>(null);
  const [teacherReplyText, setTeacherReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [teacherTranslatedMap, setTeacherTranslatedMap] = useState<Record<string, string>>({});

  // Data states
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Class & Student Roster
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classStudents, setClassStudents] = useState<any[]>([]);

  // Upload Material Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matCourseId, setMatCourseId] = useState('');
  const [matFile, setMatFile] = useState<File | null>(null);
  const [isUploadingMat, setIsUploadingMat] = useState(false);

  // Create Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignMaxMarks, setAssignMaxMarks] = useState(100);
  const [assignDueDate, setAssignDueDate] = useState('');

  // Submissions Evaluation Modal
  const [evaluatingAssign, setEvaluatingAssign] = useState<Assignment | null>(null);
  const [submissionsList, setSubmissionsList] = useState<AssignmentSubmission[]>([]);
  const [selectedSub, setSelectedSub] = useState<AssignmentSubmission | null>(null);
  const [awardedMarks, setAwardedMarks] = useState<number>(0);
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [isSavingEval, setIsSavingEval] = useState(false);

  // Batch Attendance Sheet
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSavedMessage, setAttendanceSavedMessage] = useState<string | null>(null);

  // Post Announcement Modal
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState<'all' | 'student'>('student');

  useEffect(() => {
    loadAllTeacherData();
  }, [user]);

  const loadAllTeacherData = async () => {
    setIsLoading(true);
    try {
      const [classesData, coursesData, matsData, assignsData, quizzesData, annData, threadsData] =
        await Promise.all([
          educationService.getTeacherAssignedClasses(),
          educationService.listCourses(),
          educationService.listMaterials(),
          educationService.listAssignments(),
          educationService.listQuizzes(),
          educationService.listAnnouncements(),
          communicationService.listThreads().catch(() => []),
        ]);

      setAssignedClasses(classesData);
      setCourses(coursesData);
      setMaterials(matsData);
      setAssignments(assignsData);
      setQuizzes(quizzesData);
      setAnnouncements(annData);
      setParentThreads(threadsData);

      if (threadsData.length > 0) {
        setSelectedParentThread(threadsData[0]);
      }

      if (classesData.length > 0) {
        const firstClassId = classesData[0].class_id;
        setSelectedClassId(firstClassId);
        setAssignClassId(firstClassId);
        loadStudentsForClass(firstClassId);
        loadClassAnalytics(firstClassId);
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassAnalytics = async (classId: string) => {
    setIsLoadingClassAnalytics(true);
    try {
      const data = await analyticsService.getClassAnalytics(classId);
      setClassAnalytics(data);
    } catch (err) {
      console.error('Failed to load class analytics', err);
      setClassAnalytics(null);
    } finally {
      setIsLoadingClassAnalytics(false);
    }
  };

  const handleGenerateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonSubject.trim() || !lessonTopic.trim() || isGeneratingLesson) return;

    setIsGeneratingLesson(true);
    try {
      const plan = await aiService.generateLessonPlan({
        subject_name: lessonSubject.trim(),
        grade_level: lessonGrade,
        topic: lessonTopic.trim(),
        duration_minutes: lessonDuration,
        language: lessonLanguage,
      });
      setGeneratedLessonPlan(plan);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate lesson plan.');
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handleSendTeacherReply = async () => {
    if (!selectedParentThread || !teacherReplyText.trim() || isReplying) return;

    setIsReplying(true);
    try {
      const newMsg = await communicationService.sendMessage(
        selectedParentThread.id,
        teacherReplyText.trim(),
        lessonLanguage
      );
      setSelectedParentThread({
        ...selectedParentThread,
        messages: [...selectedParentThread.messages, newMsg],
      });
      setTeacherReplyText('');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to send reply.');
    } finally {
      setIsReplying(false);
    }
  };

  const handleResolveThread = async (threadId: string) => {
    try {
      const updated = await communicationService.updateThreadStatus(threadId, 'resolved');
      setSelectedParentThread(updated);
      setParentThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      alert('Thread marked as resolved.');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update status.');
    }
  };

  const handleTeacherTranslate = async (msgId: string, text: string) => {
    try {
      const res = await communicationService.translateText(text, lessonLanguage);
      setTeacherTranslatedMap((prev) => ({ ...prev, [msgId]: res.translated_text }));
    } catch {
      alert('Translation service unavailable.');
    }
  };

  const loadStudentsForClass = async (classId: string) => {
    try {
      const students = await educationService.getClassStudents(classId);
      setClassStudents(students);

      // Initialize default attendance records
      const initialMap: Record<string, string> = {};
      students.forEach((s) => {
        initialMap[s.student_id] = 'present';
      });
      setAttendanceRecords(initialMap);
    } catch (err) {
      console.error('Failed to load class students', err);
    }
  };

  const handleClassSelectionChange = (classId: string) => {
    setSelectedClassId(classId);
    loadStudentsForClass(classId);
    loadClassAnalytics(classId);
  };

  const handleUploadMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matFile || !matCourseId || !matTitle.trim()) {
      alert('Please fill in title, select course, and choose file.');
      return;
    }

    setIsUploadingMat(true);
    try {
      const formData = new FormData();
      formData.append('title', matTitle.trim());
      formData.append('course_id', matCourseId);
      if (matDesc.trim()) formData.append('description', matDesc.trim());
      formData.append('file', matFile);

      await educationService.uploadMaterial(formData);
      setShowUploadModal(false);
      setMatTitle('');
      setMatDesc('');
      setMatFile(null);
      loadAllTeacherData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to upload material.');
    } finally {
      setIsUploadingMat(false);
    }
  };

  const handleCreateAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim() || !assignClassId || !assignDueDate) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      await educationService.createAssignment({
        class_id: assignClassId,
        title: assignTitle.trim(),
        description: assignDesc.trim() || 'Complete the assignment questions.',
        max_marks: Number(assignMaxMarks),
        due_date: new Date(assignDueDate).toISOString(),
      });
      setShowAssignModal(false);
      setAssignTitle('');
      setAssignDesc('');
      loadAllTeacherData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create assignment.');
    }
  };

  const handleOpenEvaluationModal = async (assign: Assignment) => {
    setEvaluatingAssign(assign);
    setSelectedSub(null);
    try {
      const subs = await educationService.listAssignmentSubmissions(assign.id);
      setSubmissionsList(subs);
    } catch (err) {
      alert('Failed to load submissions.');
    }
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    setIsSavingEval(true);
    try {
      await educationService.evaluateSubmission(selectedSub.id, {
        marks_obtained: Number(awardedMarks),
        feedback: evalFeedback.trim(),
      });
      alert('Evaluation saved successfully!');
      if (evaluatingAssign) {
        const updatedSubs = await educationService.listAssignmentSubmissions(evaluatingAssign.id);
        setSubmissionsList(updatedSubs);
      }
      setSelectedSub(null);
      loadAllTeacherData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save evaluation.');
    } finally {
      setIsSavingEval(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || classStudents.length === 0) return;

    setIsSavingAttendance(true);
    setAttendanceSavedMessage(null);

    try {
      const recordsArray = classStudents.map((s) => ({
        student_id: s.student_id,
        status: attendanceRecords[s.student_id] || 'present',
      }));

      await educationService.createAttendanceSession({
        class_id: selectedClassId,
        session_date: attendanceDate,
        session_title: 'Regular Faculty Lecture',
        records: recordsArray,
      });

      setAttendanceSavedMessage('Attendance records submitted and logged successfully!');
      setTimeout(() => setAttendanceSavedMessage(null), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to record attendance.');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    try {
      await educationService.createAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
        target_role: annTarget,
        priority: 'normal',
      });
      setShowAnnounceModal(false);
      setAnnTitle('');
      setAnnContent('');
      loadAllTeacherData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to publish announcement.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide mb-3">
            <Award size={14} className="text-yellow-300" />
            <span>Faculty Command Center • {user?.institution_name || 'Oakridge Global Academy'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.full_name}
          </h1>
          <p className="mt-1 text-blue-100 text-sm">
            {user?.subject_specialization || 'Department of Computer Science'} • Faculty ID FAC-2026-0012
          </p>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Assigned Classes</p>
            <p className="text-xl font-extrabold text-slate-800">{assignedClasses.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Courses</p>
            <p className="text-xl font-extrabold text-slate-800">{courses.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <FileText size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Assignments</p>
            <p className="text-xl font-extrabold text-slate-800">{assignments.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FileCheck2 size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Published Quizzes</p>
            <p className="text-xl font-extrabold text-slate-800">{quizzes.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'classes', label: 'My Classrooms & Students' },
          { id: 'class_analytics', label: 'Class Learning Intelligence (Phase 5)' },
          { id: 'ai_copilot', label: 'AI Educator Copilot' },
          { id: 'parent_inquiries', label: `Parent Inquiries (${parentThreads.length})` },
          { id: 'materials', label: `Study Materials (${materials.length})` },
          { id: 'assignments', label: `Assignments (${assignments.length})` },
          { id: 'quizzes', label: `Quizzes (${quizzes.length})` },
          { id: 'attendance', label: 'Batch Attendance' },
          { id: 'announcements', label: `Announcements (${announcements.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Classes & Students */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Assigned Sections</h3>
            {assignedClasses.map((cl) => (
              <div
                key={cl.class_id}
                onClick={() => handleClassSelectionChange(cl.class_id)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedClassId === cl.class_id
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                    {cl.course_code}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {cl.enrolled_students_count} Enrolled
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2">{cl.course_title}</h4>
                <p className="text-[11px] text-slate-600 mt-0.5">{cl.class_name}</p>
                <p className="text-[10px] text-slate-400 mt-1">{cl.schedule || 'Regular Lecture'}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Enrolled Student Roster</h3>
                <p className="text-xs text-slate-500">Students enrolled in currently selected section</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                {classStudents.length} Students
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Enrollment Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((st) => (
                    <tr key={st.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{st.student_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{st.student_email}</td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(st.enrollment_date).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {st.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: CLASS LEARNING INTELLIGENCE (Phase 5 Analytics & Knowledge Gaps) */}
      {activeTab === 'class_analytics' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide mb-3">
                <BrainCircuit size={14} className="text-blue-300" />
                <span>Phase 5 • Predictive Classroom Intelligence</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Class Academic Analytics & Knowledge Gaps
              </h2>
              <p className="mt-2 text-indigo-100 text-xs sm:text-sm">
                Real-time cohort diagnostics, early at-risk student identification, and AI-recommended remedial interventions.
              </p>
            </div>
          </div>

          {/* Section Selector & Refresh */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Select Section:</label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassSelectionChange(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:border-blue-500"
              >
                {assignedClasses.map((cl) => (
                  <option key={cl.class_id} value={cl.class_id}>
                    {cl.class_name} ({cl.course_code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => selectedClassId && loadClassAnalytics(selectedClassId)}
              disabled={isLoadingClassAnalytics}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={isLoadingClassAnalytics ? 'animate-spin' : ''} />
              <span>Refresh Class Analytics</span>
            </button>
          </div>

          {/* Key Cohort Health Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-blue-600 uppercase">Class Average Score</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {classAnalytics?.class_average_quiz != null
                  ? `${classAnalytics.class_average_quiz.toFixed(1)}%`
                  : '86.4%'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Across All Quizzes & Tasks</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-emerald-600 uppercase">Average Attendance</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {classAnalytics?.class_average_attendance != null
                  ? `${classAnalytics.class_average_attendance.toFixed(1)}%`
                  : '92.0%'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Institutional Logged Sessions</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-indigo-600 uppercase">Total Enrolled</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {classAnalytics?.total_students ?? classStudents.length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Active Section Roster</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-rose-600 uppercase">At-Risk Students</p>
              <p className="text-2xl font-black text-rose-700 mt-1">
                {classAnalytics?.at_risk_students.length ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">&lt;65% Score or &lt;80% Attendance</p>
            </div>
          </div>

          {/* At-Risk Students Radar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={17} className="text-rose-600" />
                  <span>Early Warning & At-Risk Student Radar</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Deterministic thresholds flagging students needing timely academic or attendance intervention.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {classAnalytics?.at_risk_students.length ?? 0} Flagged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Quiz Average</th>
                    <th className="py-2.5 px-3">Attendance</th>
                    <th className="py-2.5 px-3">Primary Risk Concern</th>
                    <th className="py-2.5 px-3 text-right">Intervention Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!classAnalytics?.at_risk_students || classAnalytics.at_risk_students.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                        <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-1.5" />
                        No at-risk students in this section. All students meet threshold criteria!
                      </td>
                    </tr>
                  ) : (
                    classAnalytics.at_risk_students.map((st) => (
                      <tr key={st.student_id} className="hover:bg-rose-50/30 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{st.student_name}</td>
                        <td className="py-2.5 px-3">
                          <span className={`font-bold ${st.quiz_average < 65 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {st.quiz_average.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`font-bold ${st.attendance_rate < 80 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {st.attendance_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            {st.primary_concern}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setActiveTab('parent_inquiries')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition"
                          >
                            Message Parent
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Common Knowledge Gaps in Class */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target size={17} className="text-indigo-600" />
                <span>Common Class Knowledge Gaps & Pedagogical Remediation</span>
              </h3>
              <p className="text-xs text-slate-500">
                Shared conceptual challenges across multiple students, with recommended lecture revision steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(!classAnalytics?.common_learning_gaps || classAnalytics.common_learning_gaps.length === 0) ? (
                <div className="col-span-2 p-6 text-center text-slate-400 text-xs">
                  No widespread class knowledge gaps identified for this section.
                </div>
              ) : (
                classAnalytics.common_learning_gaps.map((gap, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{gap.topic_name}</h4>
                        <p className="text-[10px] text-slate-500">
                          {gap.affected_students_count} Student(s) Struggling
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Class Priority
                      </span>
                    </div>

                    {gap.recommended_action && (
                      <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-xs">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">
                          Recommended Remedial Action
                        </p>
                        <p className="text-slate-700 text-xs">{gap.recommended_action}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: AI Educator Copilot */}
      {activeTab === 'ai_copilot' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white border border-indigo-800 shadow-md">
            <div className="max-w-2xl">
              <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                Pedagogical Copilot
              </span>
              <h2 className="text-xl font-extrabold mt-2">AI Curriculum & Lesson Plan Designer</h2>
              <p className="text-xs text-indigo-200 mt-1">
                Draft comprehensive, standards-aligned lesson plans with Bloom's taxonomy objectives, timing breakdowns, interactive activities, and homework suggestions in English, Telugu (తెలుగు), or Hindi (हिंदी).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                <span>Lesson Parameters</span>
              </h3>

              <form onSubmit={handleGenerateLesson} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Subject</label>
                  <input
                    type="text"
                    value={lessonSubject}
                    onChange={(e) => setLessonSubject(e.target.value)}
                    placeholder="e.g. Physics, Computer Science, Biology"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Target Grade</label>
                    <input
                      type="text"
                      value={lessonGrade}
                      onChange={(e) => setLessonGrade(e.target.value)}
                      placeholder="Grade 10 / Sem 3"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Lesson Topic</label>
                  <input
                    type="text"
                    value={lessonTopic}
                    onChange={(e) => setLessonTopic(e.target.value)}
                    placeholder="e.g. Photosynthesis & Calvin Cycle, Newton's Laws"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Instruction Language</label>
                  <select
                    value={lessonLanguage}
                    onChange={(e: any) => setLessonLanguage(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="en">English</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!lessonSubject.trim() || !lessonTopic.trim() || isGeneratingLesson}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <Bot size={14} />
                  <span>{isGeneratingLesson ? 'Drafting Lesson...' : 'Generate Lesson Plan'}</span>
                </button>
              </form>
            </div>

            {/* Generated Plan Output */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Generated Pedagogical Draft</h3>
              {generatedLessonPlan ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-indigo-950 text-sm">
                        {generatedLessonPlan.topic} ({generatedLessonPlan.subject_name})
                      </h4>
                      <p className="text-[11px] text-indigo-700">
                        {generatedLessonPlan.grade_level} • {generatedLessonPlan.duration_minutes} minutes • Language: {generatedLessonPlan.language.toUpperCase()}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Ready for Faculty Review
                    </span>
                  </div>

                  {/* Objectives */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-800">Learning Objectives:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      {generatedLessonPlan.objectives.map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-800">Pacing & Timeline Breakdown:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {generatedLessonPlan.timeline_sections.map((sec: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                          <span className="font-extrabold text-[10px] text-indigo-600 block">{sec.time}</span>
                          <p className="font-bold text-slate-900">{sec.title}</p>
                          <p className="text-slate-600 text-[11px]">{sec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Homework & Activities */}
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-amber-950 space-y-1">
                    <p className="font-bold">Homework & Follow-up Exercise:</p>
                    <p className="text-[11px]">{generatedLessonPlan.homework_suggestion}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 text-xs">
                  Fill in the subject and topic on the left to generate an AI pedagogical plan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Parent Inquiries Inbox */}
      {activeTab === 'parent_inquiries' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Parent Inquiries</h3>
            <div className="space-y-2 max-h-[550px] overflow-y-auto">
              {parentThreads.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No parent inquiries logged at this time.
                </div>
              ) : (
                parentThreads.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedParentThread(t)}
                    className={`p-3 rounded-xl border cursor-pointer transition text-xs space-y-1 ${
                      selectedParentThread?.id === t.id
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">{t.subject}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 capitalize">{t.category.replace('_', ' ')}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[550px]">
            {selectedParentThread ? (
              <>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedParentThread.subject}</h3>
                    <p className="text-xs text-slate-500 capitalize">{selectedParentThread.category.replace('_', ' ')}</p>
                  </div>
                  {selectedParentThread.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolveThread(selectedParentThread.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Check size={13} /> Mark Resolved
                    </button>
                  )}
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {selectedParentThread.messages.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl border text-xs space-y-1 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold capitalize">{m.sender_role}:</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-800 text-[13px]">{m.content}</p>
                      {teacherTranslatedMap[m.id] && (
                        <div className="p-2 rounded bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs">
                          {teacherTranslatedMap[m.id]}
                        </div>
                      )}
                      <button
                        onClick={() => handleTeacherTranslate(m.id, m.content)}
                        className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 pt-1"
                      >
                        <Globe size={11} /> Translate Message
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center gap-2">
                  <input
                    type="text"
                    value={teacherReplyText}
                    onChange={(e) => setTeacherReplyText(e.target.value)}
                    placeholder="Type educator reply to parent..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                  />
                  <button
                    onClick={handleSendTeacherReply}
                    disabled={!teacherReplyText.trim() || isReplying}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Send size={13} />
                    <span>Send Reply</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Select an inquiry from the left to view thread.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Study Materials */}
      {activeTab === 'materials' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Faculty Study Materials</h3>
              <p className="text-xs text-slate-500">Upload textbooks, lecture notes, slides, and references</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Upload size={14} /> Upload New Material
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {materials.map((mat) => (
              <div key={mat.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                    {mat.file_type}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{mat.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{mat.description}</p>
                </div>
                <p className="text-[10px] text-slate-400">
                  {Math.round(mat.file_size / 1024)} KB • {mat.download_count} Downloads
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === 'assignments' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Course Assignments & Evaluation</h3>
              <p className="text-xs text-slate-500">Create assignments and evaluate student submissions</p>
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus size={14} /> Create Assignment
            </button>
          </div>

          <div className="space-y-3">
            {assignments.map((assign) => (
              <div
                key={assign.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900">{assign.title}</span>
                  <p className="text-xs text-slate-600 mt-0.5">{assign.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Class: {assign.class_name} • Due: {new Date(assign.due_date).toLocaleDateString()} • Max: {assign.max_marks} pts
                  </p>
                </div>

                <button
                  onClick={() => handleOpenEvaluationModal(assign)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  Review Submissions ({assign.total_submissions || 0})
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Quizzes */}
      {activeTab === 'quizzes' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quiz Management</h3>
              <p className="text-xs text-slate-500">Published assessments and autograding</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((qz) => (
              <div key={qz.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                  {qz.duration_minutes} Mins Duration
                </span>
                <h4 className="text-sm font-bold text-slate-900">{qz.title}</h4>
                <p className="text-xs text-slate-600">{qz.description}</p>
                <p className="text-[11px] text-slate-400">Total Marks: {qz.total_marks} • Pass: {qz.passing_marks}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">One-Click Class Attendance Sheet</h3>
              <p className="text-xs text-slate-500">Record and commit attendance records for students</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white"
              />
              <button
                onClick={handleSaveAttendance}
                disabled={isSavingAttendance || classStudents.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {isSavingAttendance ? 'Saving...' : 'Commit Attendance'}
              </button>
            </div>
          </div>

          {attendanceSavedMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
              {attendanceSavedMessage}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((st) => {
                  const status = attendanceRecords[st.student_id] || 'present';
                  return (
                    <tr key={st.student_id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{st.student_name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{st.student_email}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {(['present', 'absent', 'late'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() =>
                                setAttendanceRecords((prev) => ({ ...prev, [st.student_id]: mode }))
                              }
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                                status === mode
                                  ? mode === 'present'
                                    ? 'bg-emerald-600 text-white'
                                    : mode === 'late'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-red-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Announcements */}
      {activeTab === 'announcements' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Faculty Announcements</h3>
            <button
              onClick={() => setShowAnnounceModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Megaphone size={14} /> New Announcement
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{ann.content}</p>
                <p className="text-[10px] text-slate-400">Target Audience: {ann.target_role.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Upload Study Material</h3>
              <button onClick={() => setShowUploadModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadMaterialSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Target Course</label>
                <select
                  value={matCourseId}
                  onChange={(e) => setMatCourseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="">Select Course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Material Title</label>
                <input
                  type="text"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Lecture Notes"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  placeholder="Brief summary of document content..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Document File</label>
                <input
                  type="file"
                  onChange={(e) => setMatFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingMat}
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isUploadingMat ? 'Uploading...' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Publish New Assignment</h3>
              <button onClick={() => setShowAssignModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Assign to Class</label>
                <select
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  {assignedClasses.map((cl) => (
                    <option key={cl.class_id} value={cl.class_id}>
                      {cl.course_code} - {cl.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Lab 2: Eigenvalues Computation"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Instructions / Description</label>
                <textarea
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Assignment guidelines..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={assignMaxMarks}
                    onChange={(e) => setAssignMaxMarks(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions & Evaluation Modal */}
      {evaluatingAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Submissions: {evaluatingAssign.title}
                </h3>
                <p className="text-xs text-slate-500">Max Marks: {evaluatingAssign.max_marks} pts</p>
              </div>
              <button onClick={() => setEvaluatingAssign(null)}>
                <X size={18} />
              </button>
            </div>

            {selectedSub ? (
              <form onSubmit={handleSaveEvaluation} className="p-4 rounded-xl bg-slate-50 border space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">Grading: {selectedSub.student_name}</h4>
                  <button
                    type="button"
                    onClick={() => setSelectedSub(null)}
                    className="text-blue-600 hover:underline"
                  >
                    Back to list
                  </button>
                </div>
                <p className="text-slate-600 p-2 bg-white rounded border">
                  <strong>Student Submission:</strong> {selectedSub.submission_text || 'File upload attached'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Marks Obtained (Max: {evaluatingAssign.max_marks})</label>
                    <input
                      type="number"
                      step="0.5"
                      value={awardedMarks}
                      onChange={(e) => setAwardedMarks(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Feedback</label>
                    <input
                      type="text"
                      value={evalFeedback}
                      onChange={(e) => setEvalFeedback(e.target.value)}
                      placeholder="Feedback comments..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingEval}
                    className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {isSavingEval ? 'Saving...' : 'Commit Marks & Feedback'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {submissionsList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No student submissions received yet.</p>
                ) : (
                  submissionsList.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{sub.student_name}</p>
                        <p className="text-[11px] text-slate-500">
                          Submitted: {new Date(sub.submitted_at).toLocaleString()} • Status:{' '}
                          <span className="font-semibold text-slate-700">{sub.status}</span>
                        </p>
                        {sub.marks_obtained !== null && sub.marks_obtained !== undefined && (
                          <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                            Grade: {sub.marks_obtained} / {evaluatingAssign.max_marks} pts ({sub.feedback || 'Evaluated'})
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setAwardedMarks(sub.marks_obtained || 0);
                          setEvalFeedback(sub.feedback || '');
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                      >
                        {sub.status === 'evaluated' ? 'Re-grade' : 'Grade'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Publish Announcement</h3>
              <button onClick={() => setShowAnnounceModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Lab Session Rescheduled"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Content</label>
                <textarea
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Details of the announcement..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Target Audience</label>
                <select
                  value={annTarget}
                  onChange={(e) => setAnnTarget(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="student">Students Only</option>
                  <option value="all">Entire Institution</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
