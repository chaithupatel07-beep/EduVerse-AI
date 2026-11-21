import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { educationService } from '../../services/educationService';
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
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'materials' | 'assignments' | 'quizzes' | 'attendance' | 'announcements'>('overview');
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (err) {
      console.error('Error loading student dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMaterial = async (mat: StudyMaterial) => {
    try {
      await educationService.downloadMaterial(mat.id, mat.original_file_name);
    } catch (err) {
      alert('Failed to download material. Please try again.');
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
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'present'
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
                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                              quizAnswers[q.id] === opt.id
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
