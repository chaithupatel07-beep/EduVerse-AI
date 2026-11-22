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
  Video,
  HelpCircle,
  Lightbulb,
  FileSpreadsheet,
  CheckSquare,
} from 'lucide-react';
import {
  teacherAiService,
  LessonPlan,
  QuestionPaper,
  TeachingMaterialResult,
  RemedialGuidanceResult,
  EvaluationSuggestion,
} from '../../services/teacherAiService';
import {
  parentIntelligenceService,
  MeetingRequest,
} from '../../services/parentIntelligenceService';
import { EarlyWarningTab } from '../../components/innovation/EarlyWarningTab';

interface TeacherDashboardProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ currentView, onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'classes' | 'early_warning' | 'class_analytics' | 'ai_copilot' | 'meetings' | 'parent_inquiries' | 'materials' | 'assignments' | 'quizzes' | 'attendance' | 'announcements'
  >('classes');

  // Synchronize activeTab when currentView changes from sidebar
  useEffect(() => {
    if (!currentView) return;
    if (currentView === 'dashboard' || currentView === 'classes') setActiveTab('classes');
    else if (currentView === 'curriculum' || currentView === 'materials') setActiveTab('materials');
    else if (currentView === 'assignments') setActiveTab('assignments');
    else if (currentView === 'quizzes') setActiveTab('quizzes');
    else if (currentView === 'ai-generator' || currentView === 'ai_copilot') setActiveTab('ai_copilot');
    else if (currentView === 'analytics' || currentView === 'class_analytics') setActiveTab('class_analytics');
    else if (currentView === 'early-warning' || currentView === 'early_warning') setActiveTab('early_warning');
    else if (currentView === 'meetings') setActiveTab('meetings');
    else if (currentView === 'communications' || currentView === 'parent_inquiries') setActiveTab('parent_inquiries');
    else if (currentView === 'attendance') setActiveTab('attendance');
    else if (currentView === 'announcements') setActiveTab('announcements');
  }, [currentView]);
  const [isLoading, setIsLoading] = useState(true);

  // Phase 5: Class Learning Intelligence State
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics | null>(null);
  const [isLoadingClassAnalytics, setIsLoadingClassAnalytics] = useState(false);

  // Phase 6: Teacher AI Copilot Sub-tools State
  const [aiCopilotSubTab, setAiCopilotSubTab] = useState<
    'lesson_plan' | 'question_paper' | 'teaching_materials' | 'remedial_guidance'
  >('lesson_plan');

  // AI Copilot States (11-Section Lesson Plan)
  const [lessonSubject, setLessonSubject] = useState('');
  const [lessonGrade, setLessonGrade] = useState('Grade 10');
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonDuration, setLessonDuration] = useState(45);
  const [lessonLanguage, setLessonLanguage] = useState(languageService.getCurrentLanguage());
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState<any | null>(null);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [lessonPlanStatus, setLessonPlanStatus] = useState<string>('draft');
  const [isPublishingPlan, setIsPublishingPlan] = useState(false);

  // Phase 6: Question Paper Generator State
  const [qpSubject, setQpSubject] = useState('');
  const [qpGrade, setQpGrade] = useState('Grade 10');
  const [qpTopic, setQpTopic] = useState('');
  const [qpMarks, setQpMarks] = useState(50);
  const [qpDuration, setQpDuration] = useState(60);
  const [qpEasy, setQpEasy] = useState(30);
  const [qpMed, setQpMed] = useState(50);
  const [qpHard, setQpHard] = useState(20);
  const [qpIncludeKey, setQpIncludeKey] = useState(true);
  const [qpLanguage, setQpLanguage] = useState('en');
  const [generatedQp, setGeneratedQp] = useState<QuestionPaper | null>(null);
  const [isGeneratingQp, setIsGeneratingQp] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  // Phase 6: Teaching Materials Assistant State
  const [tmSubject, setTmSubject] = useState('');
  const [tmGrade, setTmGrade] = useState('Grade 10');
  const [tmTopic, setTmTopic] = useState('');
  const [tmLanguage, setTmLanguage] = useState('en');
  const [teachingMaterial, setTeachingMaterial] = useState<TeachingMaterialResult | null>(null);
  const [isGeneratingTm, setIsGeneratingTm] = useState(false);

  // Phase 6: Remedial Guidance State
  const [remedialResult, setRemedialResult] = useState<RemedialGuidanceResult | null>(null);
  const [isGeneratingRemedial, setIsGeneratingRemedial] = useState(false);

  // Phase 6: AI-Assisted Evaluation (Teacher Safeguard)
  const [aiEvalSuggestion, setAiEvalSuggestion] = useState<EvaluationSuggestion | null>(null);
  const [isLoadingAiEval, setIsLoadingAiEval] = useState(false);

  // Phase 6: Consultation Meetings State
  const [meetingsList, setMeetingsList] = useState<MeetingRequest[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [meetingFilter, setMeetingFilter] = useState<string>('');
  const [activeMeetingModal, setActiveMeetingModal] = useState<MeetingRequest | null>(null);
  const [meetingActionLink, setMeetingActionLink] = useState('');
  const [meetingActionNotes, setMeetingActionNotes] = useState('');

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
          educationService.getTeacherAssignedClasses().catch(() => []),
          educationService.listCourses().catch(() => []),
          educationService.listMaterials().catch(() => []),
          educationService.listAssignments().catch(() => []),
          educationService.listQuizzes().catch(() => []),
          educationService.listAnnouncements().catch(() => []),
          communicationService.listThreads().catch(() => []),
        ]);

      const finalClasses = Array.isArray(classesData) && classesData.length > 0 ? classesData : [
        {
          class_id: 'cls-001',
          class_name: 'Section 11-A (AI Specialization)',
          course_id: 'crs-001',
          course_code: 'CS-401',
          course_title: 'Advanced AI & RAG Systems',
          room_number: 'Lab 402',
          student_count: 32,
          term: 'Fall 2026',
        },
        {
          class_id: 'cls-002',
          class_name: 'Section 11-B (Physics Core)',
          course_id: 'crs-002',
          course_code: 'PHY-301',
          course_title: 'Rotational Dynamics & Mechanics',
          room_number: 'Science Hall 101',
          student_count: 28,
          term: 'Fall 2026',
        },
      ];

      setAssignedClasses(finalClasses as any);
      setCourses((Array.isArray(coursesData) && coursesData.length > 0 ? coursesData : [
        {
          id: 'crs-001',
          code: 'CS-401',
          title: 'Advanced AI & RAG Systems',
          credits: 4,
          department_id: 'Computer Science',
          description: 'Vector search, embedding models, and contextual retrieval architectures.',
        }
      ]) as any);
      setMaterials(Array.isArray(matsData) ? matsData : []);
      setAssignments(Array.isArray(assignsData) ? assignsData : []);
      setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
      setAnnouncements(Array.isArray(annData) ? annData : []);
      setParentThreads(Array.isArray(threadsData) ? threadsData : []);

      if (threadsData && threadsData.length > 0) {
        setSelectedParentThread(threadsData[0]);
      }

      if (finalClasses.length > 0) {
        const firstClassId = finalClasses[0].class_id;
        setSelectedClassId(firstClassId);
        setAssignClassId(firstClassId);
        loadStudentsForClass(firstClassId);
        loadClassAnalytics(firstClassId);
      }
      loadTeacherMeetings();
    } catch (err) {
      console.error('Failed to load teacher dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeacherMeetings = async () => {
    setIsLoadingMeetings(true);
    try {
      const data = await parentIntelligenceService.listMeetings(meetingFilter || undefined);
      setMeetingsList(data);
    } catch (err) {
      console.error('Failed to load meetings', err);
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  const handleUpdateMeetingStatus = async (
    meetingId: string,
    status: 'confirmed' | 'rescheduled' | 'completed' | 'cancelled'
  ) => {
    try {
      await parentIntelligenceService.updateMeetingStatus(meetingId, {
        status,
        meeting_link: meetingActionLink || undefined,
        teacher_notes: meetingActionNotes || undefined,
      });
      alert(`Meeting status updated to ${status}.`);
      setActiveMeetingModal(null);
      setMeetingActionLink('');
      setMeetingActionNotes('');
      loadTeacherMeetings();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update meeting status.');
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
      const plan = await teacherAiService.generateLessonPlan({
        subject: lessonSubject.trim(),
        grade: lessonGrade,
        topic: lessonTopic.trim(),
        duration: lessonDuration,
        language: lessonLanguage,
      });
      setGeneratedLessonPlan(plan);
      setLessonPlanStatus(plan.status || 'draft');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate lesson plan.');
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handlePublishPlan = async (planId: string) => {
    if (!planId) return;
    setIsPublishingPlan(true);
    try {
      const updated = await teacherAiService.publishLessonPlan(planId);
      setGeneratedLessonPlan(updated);
      setLessonPlanStatus('published');
      alert('Lesson plan published to class successfully!');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to publish lesson plan.');
    } finally {
      setIsPublishingPlan(false);
    }
  };

  const handleGenerateQuestionPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qpSubject.trim() || !qpTopic.trim() || isGeneratingQp) return;
    setIsGeneratingQp(true);
    try {
      const qp = await teacherAiService.generateQuestionPaper({
        subject: qpSubject.trim(),
        grade: qpGrade,
        topic: qpTopic.trim(),
        total_marks: qpMarks,
        duration_minutes: qpDuration,
        difficulty_mix: { easy: qpEasy, medium: qpMed, hard: qpHard },
        include_answer_key: qpIncludeKey,
        language: qpLanguage,
      });
      setGeneratedQp(qp);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate question paper.');
    } finally {
      setIsGeneratingQp(false);
    }
  };

  const handleGenerateTeachingMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmSubject.trim() || !tmTopic.trim() || isGeneratingTm) return;
    setIsGeneratingTm(true);
    try {
      const tm = await teacherAiService.generateTeachingMaterials({
        subject: tmSubject.trim(),
        grade: tmGrade,
        topic: tmTopic.trim(),
        language: tmLanguage,
      });
      setTeachingMaterial(tm);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate teaching materials.');
    } finally {
      setIsGeneratingTm(false);
    }
  };

  const handleGenerateRemedialGuidance = async () => {
    if (!selectedClassId || isGeneratingRemedial) return;
    setIsGeneratingRemedial(true);
    try {
      const rem = await teacherAiService.generateRemedialGuidance(selectedClassId);
      setRemedialResult(rem);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate remedial guidance.');
    } finally {
      setIsGeneratingRemedial(false);
    }
  };

  const handleGetAiEvaluation = async (submissionId: string) => {
    setIsLoadingAiEval(true);
    try {
      const sugg = await teacherAiService.getEvaluationSuggestion(submissionId);
      setAiEvalSuggestion(sugg);
      setAwardedMarks(sugg.suggested_marks);
      setEvalFeedback(sugg.constructive_feedback || '');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate AI evaluation suggestion.');
    } finally {
      setIsLoadingAiEval(false);
    }
  };

  const handleApproveEvaluationSafeguard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || isSavingEval) return;
    setIsSavingEval(true);
    try {
      await teacherAiService.approveEvaluation(selectedSub.id, {
        decision: 'approved',
        teacher_approved_marks: awardedMarks,
        teacher_final_feedback: evalFeedback,
      });
      alert('Evaluation finalized and approved by teacher.');
      if (evaluatingAssign) {
        const subs = await educationService.listAssignmentSubmissions(evaluatingAssign.id);
        setSubmissionsList(subs);
      }
      setSelectedSub(null);
      setAiEvalSuggestion(null);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to approve evaluation.');
    } finally {
      setIsSavingEval(false);
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

      {/* Navigation Tabs (Responsive Wrap - No Horizontal Scrollbar) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'classes', navId: 'classes', label: 'My Classrooms & Students' },
          { id: 'materials', navId: 'curriculum', label: `Study Materials (${materials.length})` },
          { id: 'assignments', navId: 'assignments', label: `Assignments (${assignments.length})` },
          { id: 'ai_copilot', navId: 'ai-generator', label: 'AI Educator Copilot' },
          { id: 'class_analytics', navId: 'analytics', label: 'Class Learning Intelligence' },
          { id: 'early_warning', navId: 'early-warning', label: 'Early-Warning & Interventions' },
          { id: 'meetings', navId: 'meetings', label: `Consultation Meetings (${meetingsList.length})` },
          { id: 'parent_inquiries', navId: 'communications', label: `Parent Inquiries (${parentThreads.length})` },
          { id: 'quizzes', navId: 'quizzes', label: `Quizzes (${quizzes.length})` },
          { id: 'attendance', navId: 'attendance', label: 'Batch Attendance' },
          { id: 'announcements', navId: 'announcements', label: `Announcements (${announcements.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (onNavigate) onNavigate(tab.navId);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
                className={`p-4 rounded-xl border cursor-pointer transition ${selectedClassId === cl.class_id
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
                <span>Predictive Classroom Intelligence</span>
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
                          <span className={`font-bold ${(st.quiz_average ?? 65) < 65 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {st.quiz_average != null ? Number(st.quiz_average).toFixed(1) : '65.0'}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`font-bold ${(st.attendance_rate ?? 80) < 80 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {st.attendance_rate != null ? Number(st.attendance_rate).toFixed(1) : '80.0'}%
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

      {/* Tab: AI Educator Copilot (Phase 6 Advanced Pedagogical Intelligence) */}
      {activeTab === 'ai_copilot' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 p-6 rounded-3xl text-white border border-indigo-800 shadow-xl">
            <div className="max-w-3xl">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                Advanced Teacher AI Copilot
              </span>
              <h2 className="text-2xl font-extrabold mt-2">Faculty Intelligence & Pedagogical Copilot</h2>
              <p className="text-xs text-indigo-200 mt-1">
                Generate 11-section standards-aligned lesson plans, multi-section question papers with separate answer keys, real-world analogies, and student knowledge-gap remedial guidance. Supports English, Telugu (తెలుగు), and Hindi (हिंदी).
              </p>
            </div>

            {/* Sub-navigation */}
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-indigo-900/60">
              {[
                { id: 'lesson_plan', label: '11-Section Lesson Planner', icon: BookOpen },
                { id: 'question_paper', label: 'Question Paper & Answer Key', icon: FileSpreadsheet },
                { id: 'teaching_materials', label: 'Teaching Material Assistant', icon: Lightbulb },
                { id: 'remedial_guidance', label: 'Remedial Guidance & Gap Linking', icon: Target },
              ].map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = aiCopilotSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setAiCopilotSubTab(sub.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${isSubActive
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-indigo-100'
                      }`}
                  >
                    <SubIcon size={14} />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-tool 1: 11-Section Lesson Planner */}
          {aiCopilotSubTab === 'lesson_plan' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" />
                  <span>Lesson Parameters (11 Sections)</span>
                </h3>

                <form onSubmit={handleGenerateLesson} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Subject</label>
                    <input
                      type="text"
                      value={lessonSubject}
                      onChange={(e) => setLessonSubject(e.target.value)}
                      placeholder="e.g. Kinematics, Distributed Systems, Organic Chemistry"
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
                        placeholder="Grade 10 / B.Tech Year 3"
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
                      placeholder="e.g. Newton's 2nd Law & Orthogonal Vectors"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Instruction Language</label>
                    <select
                      value={lessonLanguage}
                      onChange={(e: any) => setLessonLanguage(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      <option value="en">English</option>
                      <option value="te">తెలుగు (Telugu - Recommended)</option>
                      <option value="hi">हिंदी (Hindi)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={!lessonSubject.trim() || !lessonTopic.trim() || isGeneratingLesson}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Bot size={14} />
                    <span>{isGeneratingLesson ? 'Synthesizing 11 Sections...' : 'Generate 11-Section Plan'}</span>
                  </button>
                </form>
              </div>

              {/* Generated Plan Output */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Standards-Aligned Pedagogical Plan
                    </h3>
                    <p className="text-[11px] text-slate-500">11 comprehensive pedagogical sections</p>
                  </div>
                  {generatedLessonPlan && (
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${lessonPlanStatus === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                        {lessonPlanStatus}
                      </span>
                      {lessonPlanStatus !== 'published' && (
                        <button
                          onClick={() => handlePublishPlan(generatedLessonPlan.id)}
                          disabled={isPublishingPlan}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <CheckCircle2 size={13} />
                          <span>{isPublishingPlan ? 'Publishing...' : 'Publish to Class'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {generatedLessonPlan ? (
                  <div className="space-y-4 text-xs max-h-[600px] overflow-y-auto pr-2">
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-indigo-950 text-sm">
                          {generatedLessonPlan.topic} ({generatedLessonPlan.subject})
                        </h4>
                        <p className="text-[11px] text-indigo-700">
                          {generatedLessonPlan.grade_level} • {generatedLessonPlan.duration_minutes} minutes • Language: {generatedLessonPlan.language?.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900">1. Prerequisites & Prior Knowledge</p>
                        <p className="text-slate-700">{JSON.stringify(generatedLessonPlan.content?.prerequisites || generatedLessonPlan.content?.prerequisites_needed || 'Basic algebraic concepts.')}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900">2. Learning Objectives (Bloom's Taxonomy)</p>
                        <p className="text-slate-700">{JSON.stringify(generatedLessonPlan.content?.learning_objectives || generatedLessonPlan.objectives || 'Identify and apply foundational formulas.')}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900">3. Instructional Materials & Apparatus</p>
                        <p className="text-slate-700">{JSON.stringify(generatedLessonPlan.content?.instructional_materials || 'Whiteboard, slides, simulation link.')}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900">4. Lesson Hook / Introduction</p>
                        <p className="text-slate-700">{generatedLessonPlan.content?.lesson_introduction || 'Engage students with a real-world puzzle.'}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900">5. Core Concept Delivery (Direct Instruction)</p>
                        <p className="text-slate-700 whitespace-pre-wrap">{generatedLessonPlan.content?.core_concept_delivery || 'Step-by-step mathematical derivation and principles.'}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900">6. Active Learning / Student Engagement Activity</p>
                        <p className="text-slate-700">{generatedLessonPlan.content?.active_learning_activity || 'Pair programming / Think-Pair-Share exercise.'}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900">7. Scaffolded Guided Practice</p>
                        <p className="text-slate-700">{generatedLessonPlan.content?.scaffolded_guided_practice || 'Teacher models problem solving with partial guidance.'}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900">8. Independent Practice</p>
                        <p className="text-slate-700">{generatedLessonPlan.content?.independent_practice || 'Individual calculation sheet with verification criteria.'}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900">9. Formative Check for Understanding (Exit Ticket)</p>
                        <p className="text-slate-700">{generatedLessonPlan.content?.formative_check_for_understanding || '1-minute formative checkpoint question.'}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900">10. Differentiation & Accessibility</p>
                        <p className="text-slate-700">{JSON.stringify(generatedLessonPlan.content?.differentiation_and_accessibility || 'Visual scaffolds for struggling students; proof challenges for advanced.')}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-950 space-y-1">
                        <p className="font-bold">11. Closure, Reflection & Homework</p>
                        <p className="text-slate-800">{generatedLessonPlan.content?.closure_and_homework || generatedLessonPlan.homework_suggestion || 'Review textbook problems and submit on EduVerse.'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-400 text-xs">
                    Fill in the parameters on the left and click Generate to produce a full 11-section lesson plan.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tool 2: Question Paper & Answer Key Generator */}
          {aiCopilotSubTab === 'question_paper' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet size={14} className="text-indigo-600" />
                  <span>Exam Blueprint & Difficulty Mix</span>
                </h3>

                <form onSubmit={handleGenerateQuestionPaper} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Subject</label>
                    <input
                      type="text"
                      value={qpSubject}
                      onChange={(e) => setQpSubject(e.target.value)}
                      placeholder="e.g. Advanced Physics, Data Structures"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Grade / Term</label>
                      <input
                        type="text"
                        value={qpGrade}
                        onChange={(e) => setQpGrade(e.target.value)}
                        placeholder="Grade 10 / Sem 2"
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Total Marks</label>
                      <input
                        type="number"
                        value={qpMarks}
                        onChange={(e) => setQpMarks(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Syllabus Topic</label>
                    <input
                      type="text"
                      value={qpTopic}
                      onChange={(e) => setQpTopic(e.target.value)}
                      placeholder="e.g. Rotational Dynamics & Angular Momentum"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <p className="font-bold text-[11px] text-slate-700">Difficulty Distribution (%)</p>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div>
                        <span className="font-bold text-emerald-600 block">Easy ({qpEasy}%)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={qpEasy}
                          onChange={(e) => setQpEasy(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-blue-600 block">Med ({qpMed}%)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={qpMed}
                          onChange={(e) => setQpMed(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-rose-600 block">Hard ({qpHard}%)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={qpHard}
                          onChange={(e) => setQpHard(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="incKey"
                      checked={qpIncludeKey}
                      onChange={(e) => setQpIncludeKey(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="incKey" className="font-semibold text-slate-700 cursor-pointer">
                      Generate Separate Answer Key & Rubric
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Language</label>
                    <select
                      value={qpLanguage}
                      onChange={(e) => setQpLanguage(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      <option value="en">English</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="hi">हिंदी (Hindi)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={!qpSubject.trim() || !qpTopic.trim() || isGeneratingQp}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Bot size={14} />
                    <span>{isGeneratingQp ? 'Drafting Question Paper...' : 'Generate Question Paper'}</span>
                  </button>
                </form>
              </div>

              {/* Output Paper */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Generated Multi-Section Paper
                    </h3>
                    <p className="text-[11px] text-slate-500">Bloom's taxonomy tagged questions with separate marking guidelines</p>
                  </div>
                  {generatedQp && (
                    <button
                      onClick={() => setShowAnswerKey(!showAnswerKey)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <CheckSquare size={13} />
                      <span>{showAnswerKey ? 'Hide Answer Key' : 'View Answer Key'}</span>
                    </button>
                  )}
                </div>

                {generatedQp ? (
                  <div className="space-y-4 text-xs max-h-[600px] overflow-y-auto pr-2">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <h4 className="font-bold text-slate-900 text-sm">{generatedQp.title}</h4>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        {generatedQp.subject} • {generatedQp.grade_level} • Total Marks: {generatedQp.total_marks} • Duration: {generatedQp.duration_minutes} min
                      </p>
                      {generatedQp.instructions && (
                        <div className="mt-2 text-[11px] text-slate-500">
                          <strong>Instructions:</strong>
                          <ul className="list-disc pl-4 mt-0.5">
                            {generatedQp.instructions.map((ins, i) => (
                              <li key={i}>{ins}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {generatedQp.sections?.map((sec, sIdx) => (
                      <div key={sIdx} className="space-y-2 border-t pt-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-extrabold text-indigo-900 text-xs">
                            {sec.section_name}: {sec.section_title || sec.question_type}
                          </h5>
                          <span className="text-[10px] font-bold text-slate-500">
                            ({sec.marks_per_question} Marks Each)
                          </span>
                        </div>

                        <div className="space-y-2">
                          {sec.questions?.map((q) => (
                            <div key={q.question_number} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-slate-800">
                                  Q{q.question_number}. {q.question_text}
                                </p>
                                <div className="flex items-center gap-1">
                                  {q.bloom_level && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                                      {q.bloom_level}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold text-slate-600">[{q.marks}M]</span>
                                </div>
                              </div>
                              {q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-2 gap-1 pl-4 mt-1">
                                  {q.options.map((opt, oIdx) => (
                                    <span key={oIdx} className="text-slate-600 text-[11px]">
                                      {String.fromCharCode(65 + oIdx)}. {opt}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {showAnswerKey && generatedQp.answer_key && (
                      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2 mt-4">
                        <h5 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Confidential Faculty Answer Key & Marking Guidelines</span>
                        </h5>
                        <div className="space-y-2">
                          {generatedQp.answer_key.map((ak) => (
                            <div key={ak.question_number} className="p-2.5 rounded-lg bg-white border border-emerald-100 text-slate-800">
                              <p className="font-bold text-[11px] text-emerald-800">
                                Q{ak.question_number} Solution:
                              </p>
                              <p className="text-slate-700 mt-0.5">{ak.correct_answer}</p>
                              {ak.step_by_step_solution && (
                                <p className="text-[10px] text-slate-500 mt-1">
                                  <strong>Steps:</strong> {ak.step_by_step_solution}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-400 text-xs">
                    Define the exam parameters and click Generate to produce the question paper and answer key.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tool 3: Teaching Material Assistant */}
          {aiCopilotSubTab === 'teaching_materials' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-amber-500" />
                  <span>Topic Explainer & Analogies</span>
                </h3>

                <form onSubmit={handleGenerateTeachingMaterial} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Subject</label>
                    <input
                      type="text"
                      value={tmSubject}
                      onChange={(e) => setTmSubject(e.target.value)}
                      placeholder="e.g. Computer Networks, Thermodynamics"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Topic</label>
                    <input
                      type="text"
                      value={tmTopic}
                      onChange={(e) => setTmTopic(e.target.value)}
                      placeholder="e.g. TCP Handshake & Packet Flow"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Grade Level</label>
                    <input
                      type="text"
                      value={tmGrade}
                      onChange={(e) => setTmGrade(e.target.value)}
                      placeholder="Grade 11 / Undergraduate"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Language</label>
                    <select
                      value={tmLanguage}
                      onChange={(e) => setTmLanguage(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="en">English</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="hi">हिंदी (Hindi)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={!tmSubject.trim() || !tmTopic.trim() || isGeneratingTm}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    <span>{isGeneratingTm ? 'Generating Materials...' : 'Generate Explanations'}</span>
                  </button>
                </form>
              </div>

              {/* Teaching Material Output */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Conceptual Analogies & Differentiated Explanations
                </h3>

                {teachingMaterial ? (
                  <div className="space-y-4 text-xs max-h-[600px] overflow-y-auto pr-2">
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                      <h4 className="font-bold text-blue-950 text-sm">{teachingMaterial.topic}</h4>
                      <p className="text-slate-700 mt-1">{teachingMaterial.executive_summary}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold text-slate-800">Everyday Real-World Analogies:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {teachingMaterial.classroom_analogies?.map((an, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1">
                            <span className="font-bold text-amber-900 text-[11px] block">{an.analogy_title}</span>
                            <p className="text-slate-700 text-[11px]"><strong>Analogy:</strong> {an.everyday_concept}</p>
                            <p className="text-indigo-700 text-[11px]"><strong>Connection:</strong> {an.academic_connection}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold text-slate-800">Common Student Misconceptions:</p>
                      <div className="space-y-2">
                        {teachingMaterial.common_misconceptions?.map((misc, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 space-y-1">
                            <p className="font-bold text-rose-900 text-[11px]">❌ Misconception: {misc.misconception}</p>
                            <p className="text-emerald-800 text-[11px]">✅ Scientific Fact: {misc.scientific_correction}</p>
                            <p className="text-slate-600 text-[10px]"><strong>Remedial Question:</strong> {misc.remedial_question}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {teachingMaterial.differentiated_explanations && (
                      <div className="space-y-2">
                        <p className="font-bold text-slate-800">Differentiated Explanations:</p>
                        <div className="space-y-2">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="font-bold text-blue-600 block mb-0.5">Beginner / Intuitive:</span>
                            <p className="text-slate-700">{teachingMaterial.differentiated_explanations.intuitive_beginner}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="font-bold text-indigo-600 block mb-0.5">Standard Curriculum:</span>
                            <p className="text-slate-700">{teachingMaterial.differentiated_explanations.standard_curriculum}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="font-bold text-purple-600 block mb-0.5">Advanced Deep Dive:</span>
                            <p className="text-slate-700">{teachingMaterial.differentiated_explanations.advanced_deep_dive}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-400 text-xs">
                    Input topic details on the left to generate real-world analogies, misconception busters, and differentiated explanations.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tool 4: Remedial Teaching Guidance */}
          {aiCopilotSubTab === 'remedial_guidance' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Target size={14} className="text-rose-600" />
                    <span>Grounded Remedial Guidance & Knowledge Gaps</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Extracts verified knowledge gaps across enrolled students and provides structured cohort remediation.
                  </p>
                </div>

                <button
                  onClick={handleGenerateRemedialGuidance}
                  disabled={!selectedClassId || isGeneratingRemedial}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isGeneratingRemedial ? 'animate-spin' : ''} />
                  <span>{isGeneratingRemedial ? 'Analyzing Class Gaps...' : 'Generate Remedial Strategy'}</span>
                </button>
              </div>

              {remedialResult ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                      <p className="text-[10px] text-indigo-600 font-bold uppercase">Total Class Gaps</p>
                      <p className="text-2xl font-extrabold text-indigo-950">{remedialResult.total_identified_gaps}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900">Priority Reteaching Topics:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {remedialResult.struggling_topics?.map((st, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{st.topic}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              {st.affected_students_count} Students
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px]">
                            <strong>Strategy:</strong> {st.recommended_reteaching_strategy}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {remedialResult.differentiated_student_groups && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">Differentiated Remedial Cohorts:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {remedialResult.differentiated_student_groups.map((grp, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 space-y-1">
                            <h5 className="font-bold text-blue-950">{grp.group_name}</h5>
                            <p className="text-slate-600 text-[11px]"><strong>Target:</strong> {grp.target_concept}</p>
                            <p className="text-slate-700 text-[11px]">{grp.recommended_activity}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {remedialResult.next_step_action_plan && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-900">Next Step Action Plan:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {remedialResult.next_step_action_plan.map((act, idx) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Click 'Generate Remedial Strategy' above to analyze this section's knowledge gaps and receive customized reteaching plans.
                </div>
              )}
            </div>
          )}
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
                    className={`p-3 rounded-xl border cursor-pointer transition text-xs space-y-1 ${selectedParentThread?.id === t.id
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

      {/* Tab: Parent–Teacher Consultation Meetings (Phase 6) */}
      {activeTab === 'meetings' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600" />
                <span>Parent Consultation Meeting Schedule</span>
              </h3>
              <p className="text-xs text-slate-500">
                Review parent consultation requests, confirm video meeting links, and manage appointments.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={meetingFilter}
                onChange={(e) => {
                  setMeetingFilter(e.target.value);
                  setTimeout(loadTeacherMeetings, 50);
                }}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="">All Statuses</option>
                <option value="requested">Pending Requests</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
              </select>

              <button
                onClick={loadTeacherMeetings}
                disabled={isLoadingMeetings}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw size={13} className={isLoadingMeetings ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Parent & Student</th>
                  <th className="py-2.5 px-3">Date & Slot</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Subject & Reason</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meetingsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                      No consultation meetings found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  meetingsList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{m.parent_name || 'Parent'}</p>
                        <p className="text-[11px] text-slate-500">Student: {m.student_name || 'Student'}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-800">{m.requested_date}</p>
                        <p className="text-[10px] text-slate-500">{m.preferred_time_slot}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.meeting_type === 'online_video' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                          {m.meeting_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <p className="font-bold text-slate-800 truncate">{m.subject}</p>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{m.reason}</p>
                        {m.meeting_link && (
                          <a
                            href={m.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:underline mt-0.5"
                          >
                            <Video size={11} /> Join Google Meet
                          </a>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${m.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {m.status === 'requested' && (
                          <button
                            onClick={() => {
                              setActiveMeetingModal(m);
                              setMeetingActionLink(m.meeting_link || 'https://meet.google.com/edu-conf-' + m.id.slice(0, 6));
                              setMeetingActionNotes(m.teacher_notes || '');
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition"
                          >
                            Confirm / Set Link
                          </button>
                        )}
                        {m.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateMeetingStatus(m.id, 'completed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Confirm Meeting Modal */}
          {activeMeetingModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-3 text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-slate-900 text-sm">Confirm Consultation Meeting</h4>
                  <button onClick={() => setActiveMeetingModal(null)}>
                    <X size={16} />
                  </button>
                </div>
                <div>
                  <p className="text-slate-600">
                    <strong>Parent:</strong> {activeMeetingModal.parent_name} • <strong>Student:</strong> {activeMeetingModal.student_name}
                  </p>
                  <p className="text-slate-600">
                    <strong>Slot:</strong> {activeMeetingModal.requested_date} ({activeMeetingModal.preferred_time_slot})
                  </p>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Google Meet / Virtual Video Link</label>
                  <input
                    type="text"
                    value={meetingActionLink}
                    onChange={(e) => setMeetingActionLink(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abc"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Teacher Notes / Preparation</label>
                  <textarea
                    value={meetingActionNotes}
                    onChange={(e) => setMeetingActionNotes(e.target.value)}
                    placeholder="Notes or instructions for the parent..."
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setActiveMeetingModal(null)}
                    className="px-3 py-1.5 font-semibold text-slate-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateMeetingStatus(activeMeetingModal.id, 'confirmed')}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                  >
                    Confirm & Send Meeting Link
                  </button>
                </div>
              </div>
            </div>
          )}
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
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition ${status === mode
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
              <form onSubmit={handleApproveEvaluationSafeguard} className="p-4 rounded-xl bg-slate-50 border space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">Grading: {selectedSub.student_name}</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSub(null);
                      setAiEvalSuggestion(null);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Back to list
                  </button>
                </div>
                <p className="text-slate-600 p-2 bg-white rounded border">
                  <strong>Student Submission:</strong> {selectedSub.submission_text || 'File upload attached'}
                </p>

                {/* AI-Assisted Evaluation Assistant Button & Safeguard Card */}
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>AI Evaluation Assistant (Non-binding Suggestion)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleGetAiEvaluation(selectedSub.id)}
                      disabled={isLoadingAiEval}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw size={11} className={isLoadingAiEval ? 'animate-spin' : ''} />
                      <span>{isLoadingAiEval ? 'Analyzing...' : 'Generate AI Suggestion'}</span>
                    </button>
                  </div>

                  {aiEvalSuggestion && (
                    <div className="space-y-2 pt-1 border-t border-indigo-200/50">
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Suggested Score: <strong>{aiEvalSuggestion.suggested_marks} / {aiEvalSuggestion.max_marks}</strong></span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                          Confidence: {(aiEvalSuggestion.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>

                      {aiEvalSuggestion.correct_concepts && aiEvalSuggestion.correct_concepts.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="font-semibold text-slate-600 text-[10px]">Concepts Verified:</span>
                          {aiEvalSuggestion.correct_concepts.map((c, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                              ✓ {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {aiEvalSuggestion.missing_points && aiEvalSuggestion.missing_points.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="font-semibold text-slate-600 text-[10px]">Points Missing:</span>
                          {aiEvalSuggestion.missing_points.map((m, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                              ! {m}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-slate-500 italic">
                        <strong>Safeguard:</strong> AI grading is advisory. Review and adjust marks below before publishing.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Teacher Approved Marks (Max: {evaluatingAssign.max_marks})</label>
                    <input
                      type="number"
                      step="0.5"
                      value={awardedMarks}
                      onChange={(e) => setAwardedMarks(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Final Teacher Feedback</label>
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
                    {isSavingEval ? 'Approving & Finalizing...' : 'Approve & Finalize Marks (Teacher Approved)'}
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
      {/* Phase 6.5 Early Warning & Interventions */}
      {activeTab === 'early_warning' && <EarlyWarningTab />}
    </div>
  );
};
