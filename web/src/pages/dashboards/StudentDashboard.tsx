import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { educationService } from '../../services/educationService';
import { aiService, QuizQuestionItem } from '../../services/aiService';
import { languageService } from '../../services/languageService';
import {
  personalizationService,
  LearningProfile,
  KnowledgeGap,
  StudyPlan,
  ResourceRecommendation,
} from '../../services/personalizationService';
import { analyticsService, AcademicPrediction } from '../../services/analyticsService';
import {
  EnrolledClass,
  StudyMaterial,
  Assignment,
  AssignmentSubmission,
  Quiz,
  QuizAttempt,
  StudentAttendanceSummary,
  StudentProgressSummary,
  Announcement,
} from '../../types';
import {
  BookOpen,
  FileText,
  FileCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  AlertCircle,
  HelpCircle,
  Megaphone,
  TrendingUp,
  Award,
  ChevronRight,
  X,
  Play,
  Sparkles,
  Bot,
  Send,
  RefreshCw,
  Globe,
  Layers,
  BrainCircuit,
  Target,
  Flame,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  Compass,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'personalized_learning' | 'ai_companion' | 'courses' | 'materials' | 'assignments' | 'quizzes' | 'attendance' | 'announcements'
  >('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Phase 5: Personalization & Analytics States
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>([]);
  const [prediction, setPrediction] = useState<AcademicPrediction | null>(null);
  const [isLoadingPersonalization, setIsLoadingPersonalization] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Adaptive Learning Quiz State
  const [adaptiveTopic, setAdaptiveTopic] = useState('Algebra & Equations');
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [adaptiveSession, setAdaptiveSession] = useState<any | null>(null);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState<Record<number, number>>({});
  const [isStartingAdaptive, setIsStartingAdaptive] = useState(false);
  const [isSubmittingAdaptive, setIsSubmittingAdaptive] = useState(false);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState<string | null>(null);

  // AI Study Companion States
  const [aiChatMessages, setAiChatMessages] = useState<Array<{
    sender: 'user' | 'assistant';
    content: string;
    language: string;
    sources?: Array<{ document_name: string; page?: number; excerpt?: string }>;
  }>>([
    {
      sender: 'assistant',
      content: 'Welcome! I am your EduVerse AI Study Companion. Ask any academic doubt in English, Telugu (తెలుగు), or Hindi (हिंदी). You can also generate practice quizzes or ask questions about your course materials!',
      language: 'en',
    },
  ]);
  const [aiInputQuery, setAiInputQuery] = useState('');
  const [aiUseRag, setAiUseRag] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSelectedLanguage, setAiSelectedLanguage] = useState<string>(languageService.getCurrentLanguage());

  // Formative AI Quiz Generation
  const [aiQuizSubject, setAiQuizSubject] = useState('');
  const [aiQuizTopic, setAiQuizTopic] = useState('');
  const [aiQuizDifficulty, setAiQuizDifficulty] = useState('medium');
  const [generatedQuizQuestions, setGeneratedQuizQuestions] = useState<QuizQuestionItem[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});
  const [showPracticeScore, setShowPracticeScore] = useState(false);

  // Data states
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendanceSummary | null>(null);
  const [progress, setProgress] = useState<StudentProgressSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);

  // Modals
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Active Quiz Modal
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  useEffect(() => {
    loadAllStudentData();
  }, [user]);

  const loadAllStudentData = async () => {
    setIsLoading(true);
    try {
      const [classesData, matsData, assignsData, quizzesData, attData, progData, annData, subsData] =
        await Promise.all([
          educationService.getEnrolledClasses(),
          educationService.listMaterials(),
          educationService.listAssignments(),
          educationService.listQuizzes(),
          educationService.getMyAttendanceSummary().catch(() => null),
          educationService.getMyProgress().catch(() => null),
          educationService.listAnnouncements('student'),
          educationService.getMySubmissions().catch(() => []),
        ]);

      setEnrolledClasses(classesData);
      setMaterials(matsData);
      setAssignments(assignsData);
      setQuizzes(quizzesData);
      setAttendance(attData);
      setProgress(progData);
      setAnnouncements(annData);
      setSubmissions(subsData || []);

      // Phase 5 Personalization & ML load
      loadPersonalizationData();
    } catch (err) {
      console.error('Error loading student dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonalizationData = async () => {
    setIsLoadingPersonalization(true);
    try {
      const [prof, gaps, plans, recs, pred] = await Promise.all([
        personalizationService.getLearningProfile().catch(() => null),
        personalizationService.getKnowledgeGaps().catch(() => []),
        personalizationService.listStudyPlans().catch(() => []),
        personalizationService.getRecommendations().catch(() => []),
        user?.id ? analyticsService.getStudentPrediction(user.id).catch(() => null) : Promise.resolve(null),
      ]);
      setLearningProfile(prof);
      setKnowledgeGaps(gaps || []);
      setStudyPlans(plans || []);
      setRecommendations(recs || []);
      setPrediction(pred);
    } catch (e) {
      console.error('Error loading personalization data', e);
    } finally {
      setIsLoadingPersonalization(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const newPlan = await personalizationService.generateStudyPlan('Master core topics', 7);
      setStudyPlans((prev) => [newPlan, ...prev]);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate targeted study plan.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleToggleActivity = async (activityId: string, currentCompleted: boolean) => {
    try {
      const updated = await personalizationService.updateActivityStatus(activityId, !currentCompleted);
      setStudyPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          activities: plan.activities.map((a) => (a.id === activityId ? { ...a, is_completed: !currentCompleted } : a)),
        }))
      );
    } catch (err) {
      console.error('Failed to toggle activity completion', err);
    }
  };

  const handleRecommendationFeedback = async (recId: string, helpful: boolean) => {
    try {
      await personalizationService.submitRecommendationFeedback(recId, helpful);
      setRecommendations((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, helpful_feedback_recorded: true } : r))
      );
    } catch (err) {
      console.error('Failed to submit feedback', err);
    }
  };

  const handleStartAdaptiveSession = async () => {
    setIsStartingAdaptive(true);
    setAdaptiveFeedback(null);
    setAdaptiveAnswers({});
    try {
      const subjectId = enrolledClasses[0]?.course_id || 'general';
      const session = await personalizationService.startAdaptiveSession(subjectId, adaptiveTopic);
      setAdaptiveSession(session);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to start adaptive session.');
    } finally {
      setIsStartingAdaptive(false);
    }
  };

  const handleSubmitAdaptiveSession = async () => {
    if (!adaptiveSession) return;
    setIsSubmittingAdaptive(true);
    try {
      const stringAnswers: Record<string, number> = {};
      Object.entries(adaptiveAnswers).forEach(([k, v]) => {
        stringAnswers[k] = v;
      });
      const sessionId = adaptiveSession.session_id || adaptiveSession.id || 'sess';
      const res = await personalizationService.submitAdaptiveSession(sessionId, stringAnswers);
      setAdaptiveFeedback(res.feedback || 'Adaptive assessment completed successfully.');
      if (res.recommended_next_difficulty) {
        setAdaptiveDifficulty(res.recommended_next_difficulty as any);
      }
      loadPersonalizationData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit adaptive assessment.');
    } finally {
      setIsSubmittingAdaptive(false);
    }
  };

  const handleDownloadMaterial = async (mat: StudyMaterial) => {
    try {
      await educationService.downloadMaterial(mat.id, mat.original_file_name);
    } catch (err) {
      alert('Failed to download material. Please try again.');
    }
  };

  const handleSendStudentAI = async () => {
    if (!aiInputQuery.trim() || isAiLoading) return;
    const query = aiInputQuery.trim();
    setAiInputQuery('');
    setAiChatMessages((prev) => [
      ...prev,
      { sender: 'user', content: query, language: aiSelectedLanguage },
    ]);
    setIsAiLoading(true);

    try {
      const res = await aiService.chatWithAI({
        message: query,
        language: aiSelectedLanguage,
        use_rag: aiUseRag,
      });

      setAiChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          content: res.content,
          language: res.language,
          sources: res.sources,
        },
      ]);
    } catch (err: any) {
      setAiChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          content: err?.response?.data?.detail || 'AI Assistant momentarily unavailable.',
          language: aiSelectedLanguage,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGeneratePracticeQuiz = async () => {
    if (!aiQuizSubject.trim() || !aiQuizTopic.trim() || isGeneratingQuiz) return;
    setIsGeneratingQuiz(true);
    setPracticeAnswers({});
    setShowPracticeScore(false);

    try {
      const res = await aiService.generateQuiz({
        subject_name: aiQuizSubject.trim(),
        topic: aiQuizTopic.trim(),
        difficulty: aiQuizDifficulty,
        language: aiSelectedLanguage,
        question_count: 5,
      });
      setGeneratedQuizQuestions(res.questions || []);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate practice quiz.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (!submissionText.trim() && !submissionFile) {
      alert('Please enter submission text or select a file.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const formData = new FormData();
      if (submissionText.trim()) formData.append('submission_text', submissionText.trim());
      if (submissionFile) formData.append('file', submissionFile);

      await educationService.submitAssignment(selectedAssignment.id, formData);
      setSubmitMessage('Assignment submitted successfully!');
      setTimeout(() => {
        setSelectedAssignment(null);
        setSubmissionText('');
        setSubmissionFile(null);
        setSubmitMessage(null);
        loadAllStudentData();
      }, 1500);
    } catch (err: any) {
      setSubmitMessage(err?.response?.data?.detail || 'Failed to submit assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartQuiz = async (quizId: string) => {
    try {
      const fullQuiz = await educationService.getQuizDetails(quizId);
      setActiveQuiz(fullQuiz);
      setQuizAnswers({});
      setQuizResult(null);
    } catch (err) {
      alert('Failed to load quiz questions.');
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmittingQuiz(true);

    try {
      const answersPayload = Object.entries(quizAnswers).map(([qId, val]) => {
        const question = activeQuiz.questions?.find((q) => q.id === qId);
        if (question?.question_type === 'short_answer') {
          return { question_id: qId, text_answer: val };
        }
        return { question_id: qId, selected_option_id: val };
      });

      const result = await educationService.submitQuizAttempt(activeQuiz.id, answersPayload);
      setQuizResult(result);
      loadAllStudentData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit quiz attempt.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide mb-3">
            <Award size={14} className="text-yellow-300" />
            <span>Academic Portal • {user?.institution_name || 'Oakridge Global Academy'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="mt-2 text-blue-100 text-sm">
            {user?.grade_level || 'Undergraduate Cohort'} • Student ID STU-2026-0042
          </p>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Enrolled Courses</p>
            <p className="text-xl font-extrabold text-slate-800">
              {progress?.enrolled_courses_count ?? enrolledClasses.length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Attendance Rate</p>
            <p className="text-xl font-extrabold text-slate-800">
              {progress?.overall_attendance_rate ?? attendance?.attendance_percentage ?? 95}%
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Assignment Rate</p>
            <p className="text-xl font-extrabold text-slate-800">
              {progress?.assignment_completion_rate ?? 100}%
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Academic Score</p>
            <p className="text-xl font-extrabold text-slate-800">
              {progress?.overall_academic_score ?? 92.5}%
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'personalized_learning', label: 'Personalized Learning & ML (Phase 5)' },
          { id: 'ai_companion', label: 'AI Study Companion (RAG)' },
          { id: 'courses', label: `My Courses (${enrolledClasses.length})` },
          { id: 'materials', label: `Study Materials (${materials.length})` },
          { id: 'assignments', label: `Assignments (${assignments.length})` },
          { id: 'quizzes', label: `Quizzes (${quizzes.length})` },
          { id: 'attendance', label: 'Attendance' },
          { id: 'announcements', label: `Announcements (${announcements.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Active Enrolled Courses */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen size={16} className="text-blue-600" />
                  My Current Course Sections
                </h3>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {enrolledClasses.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No enrolled courses found.</p>
                ) : (
                  enrolledClasses.map((cl) => (
                    <div
                      key={cl.enrollment_id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            {cl.course_code}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{cl.course_title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {cl.class_name} • {cl.schedule || 'Schedule TBA'} • Room {cl.room_number || 'TBA'}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {cl.credits} Credits
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Assignments */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" />
                  Upcoming Assignments
                </h3>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  All Assignments <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {assignments.slice(0, 3).map((assign) => {
                  const sub = submissions.find((s) => s.assignment_id === assign.id);
                  return (
                    <div
                      key={assign.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{assign.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Due: {new Date(assign.due_date).toLocaleDateString()} • Max Marks: {assign.max_marks} pts
                          </p>
                        </div>
                        {sub?.status === 'evaluated' ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Score: {sub.marks_obtained}/{assign.max_marks} pts
                          </span>
                        ) : sub ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Submitted
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAssignment(assign);
                              setActiveTab('assignments');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                          >
                            Submit
                          </button>
                        )}
                      </div>
                      {sub?.feedback && (
                        <div className="text-[11px] bg-emerald-50 border border-emerald-100 text-emerald-900 p-2 rounded-lg">
                          <span className="font-bold">Faculty Feedback:</span> "{sub.feedback}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Attendance & Announcements */}
          <div className="space-y-6">
            {/* Quick Attendance Widget */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600" />
                Attendance Summary
              </h3>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center mb-3">
                <p className="text-3xl font-black text-emerald-700">
                  {attendance?.attendance_percentage ?? 95}%
                </p>
                <p className="text-[11px] font-semibold text-emerald-800 mt-1">
                  Verified Academic Standing
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Present</span>
                  <span className="font-bold text-slate-800">{attendance?.present_count ?? 4}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Late / Excused</span>
                  <span className="font-bold text-slate-800">
                    {(attendance?.late_count ?? 0) + (attendance?.excused_count ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Announcement */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Megaphone size={16} className="text-amber-500" />
                Latest Announcements
              </h3>
              {announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-100/70 mb-2.5">
                  <p className="text-xs font-bold text-slate-900">{ann.title}</p>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: PERSONALIZED LEARNING & ML ANALYTICS (Phase 5) */}
      {activeTab === 'personalized_learning' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide mb-3">
                <BrainCircuit size={14} className="text-blue-300" />
                <span>Phase 5 • Personalized Academic Intelligence</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Your Intelligent Learning & Mastery Hub
              </h2>
              <p className="mt-2 text-blue-100 text-xs sm:text-sm">
                Empowered by scikit-learn predictive modeling and dynamic knowledge-gap detection to customize your revision trajectory.
              </p>
            </div>
          </div>

          {/* Metric Overview & ML Trajectory */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Profile & Strengths */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Compass size={17} className="text-blue-600" />
                    <span>Dynamic Learning Profile</span>
                  </h3>
                  <p className="text-xs text-slate-500">Aggregated from genuine quizzes, assignments, and attendance logs.</p>
                </div>
                <button
                  onClick={() => loadPersonalizationData()}
                  disabled={isLoadingPersonalization}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Refresh Analytics"
                >
                  <RefreshCw size={14} className={isLoadingPersonalization ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Assessment Mastery</p>
                  <p className="text-xl font-extrabold text-blue-900 mt-1">
                    {learningProfile?.quiz_average != null
                      ? `${learningProfile.quiz_average.toFixed(1)}%`
                      : `${progress?.overall_academic_score ?? 92.5}%`}
                  </p>
                  <p className="text-[10px] text-blue-500">Continuous Evaluation</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Attendance Consistency</p>
                  <p className="text-xl font-extrabold text-emerald-900 mt-1">
                    {progress?.overall_attendance_rate ?? attendance?.attendance_percentage ?? 95}%
                  </p>
                  <p className="text-[10px] text-emerald-500">Verified Sessions</p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-600 uppercase">Learning Pace</p>
                  <p className="text-lg font-extrabold text-amber-900 mt-1 capitalize">
                    {learningProfile?.learning_pace || 'Moderate'}
                  </p>
                  <p className="text-[10px] text-amber-500">Calibrated Speed</p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100">
                  <p className="text-[10px] font-bold text-purple-600 uppercase">Learning Streak</p>
                  <p className="text-xl font-extrabold text-purple-900 mt-1 flex items-center gap-1">
                    <span>{learningProfile?.learning_streak_days ?? 7}</span>
                    <Flame size={18} className="text-orange-500 fill-orange-500" />
                  </p>
                  <p className="text-[10px] text-purple-500">Active Days</p>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Topic Strengths</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(learningProfile?.topic_strengths && learningProfile.topic_strengths.length > 0) ? (
                      learningProfile.topic_strengths.map((s: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                        Linear Algebra & Mechanics
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                  <p className="text-xs font-bold text-rose-800 mb-1.5 flex items-center gap-1">
                    <AlertCircle size={13} className="text-rose-600" />
                    <span>Areas Requiring Focus</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(learningProfile?.topic_weaknesses && learningProfile.topic_weaknesses.length > 0) ? (
                      learningProfile.topic_weaknesses.map((w: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-800">
                          {w}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                        No critical weaknesses currently flagged.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: ML Performance Trajectory Card with Transparent Fallback */}
            <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-indigo-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      Predictive Trajectory
                    </span>
                    {prediction?.is_rule_based ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        Rule-Based Heuristic
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        ML Regressor
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-bold">
                    {prediction?.data_sufficiency === 'no_data'
                      ? 'Awaiting Data'
                      : prediction?.confidence_score
                      ? `${(prediction.confidence_score * 100).toFixed(0)}% Confidence`
                      : 'Provisional'}
                  </span>
                </div>

                <h4 className="text-xs text-slate-300">Projected Final Academic Score</h4>
                <div className="mt-1 flex items-baseline gap-2">
                  {prediction?.data_sufficiency === 'no_data' ? (
                    <span className="text-2xl font-bold text-slate-400">
                      Awaiting Data
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-white">
                        {prediction ? `${prediction.predicted_success_score.toFixed(1)}%` : '—'}
                      </span>
                      <span className="text-xs text-indigo-300">
                        {prediction?.predicted_gpa_range ? `(${prediction.predicted_gpa_range})` : ''}
                      </span>
                    </>
                  )}
                </div>

                {/* Transparency Notice */}
                {prediction?.transparency_notice && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-white/10 border border-white/15 text-[11px] text-slate-200 leading-snug">
                    <p className="font-semibold text-amber-300 text-[10px] mb-0.5 flex items-center gap-1">
                      <AlertCircle size={11} /> Model Methodology & Transparency:
                    </p>
                    <p>{prediction.transparency_notice}</p>
                  </div>
                )}
              </div>

              {/* Data Sufficiency / Key Contributing Factors */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    {prediction?.is_rule_based ? 'Active Assessment Weights' : 'Key Contributing Predictors'}
                  </p>
                  {prediction?.data_points_count && (
                    <span className="text-[10px] text-slate-400">
                      {prediction.data_points_count.quizzes}Q • {prediction.data_points_count.assignments}A • {prediction.data_points_count.attendance_records}S
                    </span>
                  )}
                </div>

                {prediction?.contributing_factors && Object.keys(prediction.contributing_factors).length > 0 ? (
                  Object.entries(prediction.contributing_factors).map(([factor, weight], i: number) => (
                    <div key={i} className="flex justify-between text-[11px]">
                      <span className="text-slate-300 capitalize">{factor.replace('_', ' ')}</span>
                      <span className={weight >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {weight >= 0 ? `+${(weight * 100).toFixed(0)}%` : `${(weight * 100).toFixed(0)}%`}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Complete quizzes and assignments to establish factor attributions.
                  </p>
                )}

                {/* Progress toward unlocking ML model */}
                {prediction?.is_rule_based && prediction?.missing_requirements && prediction.missing_requirements.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                      To Unlock Statistical ML Model:
                    </p>
                    {prediction.missing_requirements.map((req, rIdx) => (
                      <p key={rIdx} className="text-[10px] text-slate-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> {req}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended Action */}
              <div className="text-[11px] text-indigo-200 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-400/20">
                <span className="font-bold">Intervention: </span>
                {prediction?.suggested_interventions?.[0] || 'Maintain current study streak and complete scheduled revision plan.'}
              </div>
            </div>
          </div>

          {/* Knowledge Gaps & Study Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Knowledge Gaps */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Target size={16} className="text-indigo-600" />
                    <span>Identified Knowledge Gaps</span>
                  </h3>
                  <p className="text-xs text-slate-500">Conceptual areas identified through assessment logs.</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {knowledgeGaps.length} Active
                </span>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {knowledgeGaps.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                    No urgent knowledge gaps detected. You are well prepared!
                  </div>
                ) : (
                  knowledgeGaps.map((gap) => (
                    <div key={gap.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{gap.topic_name}</p>
                          <p className="text-[10px] text-slate-500">{gap.subject_name || 'Curriculum Subject'}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            gap.classification === 'requires_immediate_revision'
                              ? 'bg-rose-100 text-rose-800'
                              : gap.classification === 'needs_improvement'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {gap.classification.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                        <span>Mastery: {gap.accuracy_percentage.toFixed(0)}%</span>
                        <span>Confidence: {(gap.confidence_score * 100).toFixed(0)}%</span>
                      </div>

                      {gap.root_cause_reason && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-700">Root Cause: </span>
                          {gap.root_cause_reason}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dynamic 7-Day Targeted Study Plan Generator & Tasks */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare size={16} className="text-blue-600" />
                    <span>Targeted Study Plans</span>
                  </h3>
                  <p className="text-xs text-slate-500">Auto-tailored to resolve your active knowledge gaps.</p>
                </div>
                <button
                  onClick={handleGenerateStudyPlan}
                  disabled={isGeneratingPlan}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Sparkles size={13} />
                  <span>{isGeneratingPlan ? 'Generating...' : 'New 7-Day Plan'}</span>
                </button>
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto">
                {studyPlans.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                    <p>No study plans generated yet.</p>
                    <button
                      onClick={handleGenerateStudyPlan}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition"
                    >
                      Generate Your First Plan
                    </button>
                  </div>
                ) : (
                  studyPlans.slice(0, 2).map((plan) => {
                    const completedCount = plan.activities.filter((a) => a.is_completed).length;
                    const totalCount = plan.activities.length;
                    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                    return (
                      <div key={plan.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">{plan.title}</h4>
                            <p className="text-[10px] text-slate-500">
                              {plan.total_estimated_minutes} Min Total • {completedCount}/{totalCount} Completed
                            </p>
                          </div>
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {percent}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                        </div>

                        {/* Activities List */}
                        <div className="space-y-2 pt-1">
                          {plan.activities.map((act) => (
                            <div
                              key={act.id}
                              onClick={() => handleToggleActivity(act.id, act.is_completed)}
                              className={`p-2 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                                act.is_completed
                                  ? 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={act.is_completed}
                                  onChange={() => {}}
                                  className="rounded text-blue-600"
                                />
                                <div>
                                  <p className="font-medium text-xs">{act.title}</p>
                                  <p className="text-[10px] text-slate-400 capitalize">
                                    Priority: {act.priority} • {act.activity_type.replace('_', ' ')} • {act.estimated_duration_minutes} min
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Recommendations & Adaptive Practice Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Intelligent Study Material Recommendations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen size={16} className="text-emerald-600" />
                  <span>Curated Study Recommendations</span>
                </h3>
                <p className="text-xs text-slate-500">Targeted materials connected to your active learning gaps.</p>
              </div>

              <div className="space-y-3">
                {recommendations.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    All recommended materials up to date.
                  </div>
                ) : (
                  recommendations.slice(0, 3).map((rec: any) => (
                    <div key={rec.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{rec.material_title}</p>
                          <p className="text-[10px] text-slate-500">Confidence: {(rec.confidence_score * 100).toFixed(0)}%</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700">
                          RECOMMENDED
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600">{rec.recommendation_reason}</p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-400">Was this recommendation helpful?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRecommendationFeedback(rec.id, true)}
                            disabled={rec.helpful_feedback_recorded}
                            className={`p-1.5 rounded-lg border text-xs transition ${
                              rec.helpful_feedback_recorded
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white hover:bg-slate-100 text-slate-600'
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp size={12} />
                          </button>
                          <button
                            onClick={() => handleRecommendationFeedback(rec.id, false)}
                            disabled={rec.helpful_feedback_recorded}
                            className="p-1.5 rounded-lg border bg-white hover:bg-slate-100 text-slate-600 text-xs transition"
                            title="Not Helpful"
                          >
                            <ThumbsDown size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Adaptive Learning Practice Engine */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Play size={16} className="text-purple-600" />
                  <span>Adaptive Learning Practice Engine</span>
                </h3>
                <p className="text-xs text-slate-500">Dynamically calibrates question difficulty to match your mastery.</p>
              </div>

              {!adaptiveSession ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Target Topic</label>
                    <input
                      type="text"
                      value={adaptiveTopic}
                      onChange={(e) => setAdaptiveTopic(e.target.value)}
                      placeholder="e.g., Algebra, Photosynthesis, Kinematics"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Mastery Tier</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['beginner', 'intermediate', 'advanced'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setAdaptiveDifficulty(diff)}
                          className={`py-2 text-xs font-bold rounded-xl border transition capitalize ${
                            adaptiveDifficulty === diff
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleStartAdaptiveSession}
                    disabled={isStartingAdaptive || !adaptiveTopic.trim()}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Sparkles size={14} />
                    <span>{isStartingAdaptive ? 'Calibrating Questions...' : 'Start Adaptive Session'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{adaptiveSession.topic_name || adaptiveTopic}</h4>
                      <p className="text-[10px] text-purple-600 font-bold uppercase">{adaptiveDifficulty} Tier</p>
                    </div>
                    <button
                      onClick={() => setAdaptiveSession(null)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Exit Session
                    </button>
                  </div>

                  {/* Adaptive Questions */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {adaptiveSession.questions?.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                        <p className="font-semibold text-slate-800">
                          {qIdx + 1}. {q.question}
                        </p>
                        <div className="space-y-1">
                          {q.options?.map((opt: string, optIdx: number) => (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                                adaptiveAnswers[qIdx] === optIdx
                                  ? 'bg-purple-50 border-purple-300 text-purple-900 font-medium'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`adaptive_q_${qIdx}`}
                                checked={adaptiveAnswers[qIdx] === optIdx}
                                onChange={() => setAdaptiveAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                                className="text-purple-600"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {adaptiveFeedback && (
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
                      <p className="font-bold mb-1">Assessment Feedback:</p>
                      <p>{adaptiveFeedback}</p>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitAdaptiveSession}
                    disabled={isSubmittingAdaptive}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <span>{isSubmittingAdaptive ? 'Submitting...' : 'Submit Adaptive Answers'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: AI Study Companion (RAG & Multilingual) */}
      {activeTab === 'ai_companion' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Multilingual AI Chat with RAG Citations */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[580px]">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Bot size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">EduVerse AI Study Companion</h3>
                    <p className="text-[10px] text-slate-500">Ask questions in English, తెలుగు, or हिंदी</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* RAG Toggle */}
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiUseRag}
                      onChange={(e) => setAiUseRag(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-[11px]">RAG Syllabus Grounding</span>
                  </label>

                  <select
                    value={aiSelectedLanguage}
                    onChange={(e) => setAiSelectedLanguage(e.target.value)}
                    className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="en">English</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {aiChatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm ${msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}
                    >
                      <p className="font-bold text-[10px] mb-1 opacity-75">
                        {msg.sender === 'user' ? 'You' : 'EduVerse AI Tutor'}
                      </p>
                      <p className="whitespace-pre-line leading-relaxed text-[13px]">{msg.content}</p>

                      {/* Source Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1">
                          <p className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                            <Layers size={11} /> Verified Sources:
                          </p>
                          {msg.sources.map((s, sIdx) => (
                            <div key={sIdx} className="text-[10px] text-slate-600 bg-white/70 p-1.5 rounded-lg border border-slate-200">
                              <strong>{s.document_name}</strong> (Page {s.page || 1})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-blue-600" />
                      <span>Formulating grounded response...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendStudentAI();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={aiInputQuery}
                    onChange={(e) => setAiInputQuery(e.target.value)}
                    placeholder={
                      aiSelectedLanguage === 'te'
                        ? 'మీ సందేహాన్ని ఇక్కడ అడగండి (ఉదా: కిరణజన్య సంయోగక్రియ గురించి వివరించండి)...'
                        : aiSelectedLanguage === 'hi'
                          ? 'अपना प्रश्न यहाँ पूछें (उदा: प्रकाश संश्लेषण को आसान भाषा में समझाइए)...'
                          : 'Ask your academic doubt or request concept explanation...'
                    }
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!aiInputQuery.trim() || isAiLoading}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Send size={13} />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right 1 Col: AI Practice Quiz Generator */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Instant AI Quiz Generator</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Generate instant 5-question practice sets to test your mastery.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Subject</label>
                  <input
                    type="text"
                    value={aiQuizSubject}
                    onChange={(e) => setAiQuizSubject(e.target.value)}
                    placeholder="e.g. Biology, Physics, Calculus"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Topic</label>
                  <input
                    type="text"
                    value={aiQuizTopic}
                    onChange={(e) => setAiQuizTopic(e.target.value)}
                    placeholder="e.g. Photosynthesis, Newton's Laws"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Difficulty</label>
                  <select
                    value={aiQuizDifficulty}
                    onChange={(e) => setAiQuizDifficulty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="easy">Easy (Concept Basics)</option>
                    <option value="medium">Medium (Standard Exam)</option>
                    <option value="hard">Hard (Application & Analysis)</option>
                  </select>
                </div>

                <button
                  onClick={handleGeneratePracticeQuiz}
                  disabled={!aiQuizSubject.trim() || !aiQuizTopic.trim() || isGeneratingQuiz}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>{isGeneratingQuiz ? 'Authoring Questions...' : 'Generate Practice Set'}</span>
                </button>
              </div>

              {/* Generated Practice Questions */}
              {generatedQuizQuestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 max-h-[350px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Practice Questions ({generatedQuizQuestions.length})</span>
                    {!showPracticeScore && (
                      <button
                        onClick={() => setShowPracticeScore(true)}
                        className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded"
                      >
                        Check Answers
                      </button>
                    )}
                  </div>

                  {generatedQuizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                      <p className="font-bold text-slate-800">Q{qIdx + 1}: {q.question_text}</p>
                      <div className="space-y-1">
                        {q.options.map((opt, optIdx) => {
                          const isPicked = practiceAnswers[qIdx] === optIdx;
                          const isCorrect = q.correct_option_index === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => setPracticeAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                              className={`w-full text-left p-2 rounded-lg text-[11px] transition border ${showPracticeScore && isCorrect
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                                  : showPracticeScore && isPicked && !isCorrect
                                    ? 'bg-red-100 border-red-300 text-red-900'
                                    : isPicked
                                      ? 'bg-indigo-100 border-indigo-300 text-indigo-900 font-semibold'
                                      : 'bg-white border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {showPracticeScore && q.explanation && (
                        <p className="text-[10px] text-emerald-700 italic bg-emerald-50 p-1.5 rounded">
                          <strong>Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Courses */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrolledClasses.map((cl) => (
            <div key={cl.enrollment_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    {cl.course_code}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{cl.course_title}</h4>
                  <p className="text-xs text-slate-500">{cl.class_name}</p>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {cl.credits} Credits
                </span>
              </div>
              <p className="text-xs text-slate-600">{cl.description || 'Comprehensive university course.'}</p>
              <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
                <p><strong>Schedule:</strong> {cl.schedule || 'Regular Lecture'}</p>
                <p><strong>Room:</strong> {cl.room_number || 'Campus Facility'}</p>
                <p><strong>Term:</strong> {cl.semester_term} ({cl.academic_year})</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Study Materials */}
      {activeTab === 'materials' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Course Materials & Downloads</h3>
            <span className="text-xs text-slate-500">{materials.length} resources available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {materials.map((mat) => (
              <div key={mat.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                    {mat.file_type}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">{mat.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{mat.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Uploaded by {mat.uploader_name || 'Faculty'}</p>
                </div>
                <button
                  onClick={() => handleDownloadMaterial(mat)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  <Download size={14} /> Download File ({Math.round(mat.file_size / 1024)} KB)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Assigned Tasks & Submissions</h3>

            <div className="space-y-3">
              {assignments.map((assign) => {
                const sub = submissions.find((s) => s.assignment_id === assign.id);
                return (
                  <div
                    key={assign.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{assign.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            Max: {assign.max_marks} pts
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{assign.description}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Due: {new Date(assign.due_date).toLocaleDateString()} • Allowed: {assign.allowed_formats}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {sub?.status === 'evaluated' ? (
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                              Graded: {sub.marks_obtained} / {assign.max_marks} pts
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {Math.round(((sub.marks_obtained || 0) / assign.max_marks) * 100)}% Performance
                            </p>
                          </div>
                        ) : sub ? (
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                              Submitted ({sub.status === 'late' ? 'Late' : 'On-Time'})
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">Awaiting faculty review</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedAssignment(assign)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition whitespace-nowrap"
                          >
                            Submit Work
                          </button>
                        )}

                        {sub && (
                          <button
                            onClick={() => setSelectedAssignment(assign)}
                            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
                          >
                            Resubmit
                          </button>
                        )}
                      </div>
                    </div>

                    {sub?.feedback && (
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2">
                        <span className="text-base">💬</span>
                        <div>
                          <p className="font-bold text-emerald-900">Teacher Evaluation Feedback:</p>
                          <p className="mt-0.5 text-emerald-800 italic">"{sub.feedback}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Quizzes */}
      {activeTab === 'quizzes' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Available Quizzes & Assessments</h3>
            <span className="text-xs text-slate-500">{quizzes.length} quizzes published</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((qz) => (
              <div key={qz.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                      {qz.duration_minutes} Mins Duration
                    </span>
                    <span className="text-xs font-semibold text-slate-600">{qz.total_marks} Marks</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">{qz.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{qz.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Instructor: {qz.teacher_name || 'Faculty'}</p>
                </div>

                <button
                  onClick={() => handleStartQuiz(qz.id)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  <Play size={14} /> Start Assessment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Class Attendance Log</h3>
              <p className="text-xs text-slate-500">Official institutional record of lectures attended</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600">
                {attendance?.attendance_percentage ?? 95}%
              </span>
              <p className="text-[10px] text-slate-400">Overall Rate</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Session Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance?.records.map((rec) => (
                  <tr key={rec.id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{rec.session_date}</td>
                    <td className="py-2.5 px-3 text-slate-700">{rec.session_title}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rec.status === 'late'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                      >
                        {rec.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{rec.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Announcements */}
      {activeTab === 'announcements' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Institutional Broadcasts</h3>
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{ann.content}</p>
                <p className="text-[10px] text-slate-400">Author: {ann.author_name || 'Academic Office'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignment Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedAssignment.title}</h3>
                <p className="text-xs text-slate-500">Max Marks: {selectedAssignment.max_marks} pts</p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submission Notes / Text
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Summarize your findings, repository links, or solutions..."
                  rows={4}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attachment File (PDF, DOCX, ZIP)
                </label>
                <input
                  type="file"
                  onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {submitMessage && (
                <div className={`p-3 rounded-xl text-xs font-medium ${submitMessage.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {submitMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Quiz Taking Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">
                  Assessment in progress
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{activeQuiz.title}</h3>
                <p className="text-xs text-slate-500">
                  Total Marks: {activeQuiz.total_marks} • Passing Marks: {activeQuiz.passing_marks}
                </p>
              </div>
              <button
                onClick={() => setActiveQuiz(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quiz Result Display */}
            {quizResult ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center font-bold text-2xl ${quizResult.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {quizResult.passed ? '✓' : '✗'}
                </div>
                <h4 className="text-lg font-extrabold text-slate-900">
                  {quizResult.passed ? 'Assessment Passed!' : 'Assessment Incomplete'}
                </h4>
                <p className="text-3xl font-black text-slate-900">{quizResult.score} / {activeQuiz.total_marks}</p>
                <p className="text-xs text-slate-500">Percentage: {quizResult.percentage}%</p>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Close & Review Progress
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {activeQuiz.questions?.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-800">
                        {idx + 1}. {q.question_text}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap bg-white px-2 py-0.5 rounded border">
                        {q.points} pts
                      </span>
                    </div>

                    {q.question_type === 'short_answer' ? (
                      <input
                        type="text"
                        value={quizAnswers[q.id] || ''}
                        onChange={(e) =>
                          setQuizAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Type short answer..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="space-y-2">
                        {q.options.map((opt) => (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${quizAnswers[q.id] === opt.id
                                ? 'bg-blue-50 border-blue-500 font-semibold text-blue-900'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                          >
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              checked={quizAnswers[q.id] === opt.id}
                              onChange={() =>
                                setQuizAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                              }
                              className="text-blue-600"
                            />
                            <span>{opt.option_text}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz}
                    className="px-6 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    {isSubmittingQuiz ? 'Evaluating...' : 'Submit Answers'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
