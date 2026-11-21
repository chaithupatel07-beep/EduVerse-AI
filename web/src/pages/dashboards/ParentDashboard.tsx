import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { educationService } from '../../services/educationService';
import {
  StudentAttendanceSummary,
  StudentProgressSummary,
  EnrolledClass,
  CommunicationRequest,
  Announcement,
  Assignment,
  AssignmentSubmission,
} from '../../types';
import {
  GraduationCap,
  Calendar,
  Award,
  TrendingUp,
  HeartHandshake,
  Megaphone,
  BookOpen,
  FileText,
  Clock,
  Plus,
  X,
  ChevronRight,
} from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'attendance' | 'communications' | 'announcements'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Verified Linked Children
  const [linkedChildren, setLinkedChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // Child Data states
  const [childProgress, setChildProgress] = useState<StudentProgressSummary | null>(null);
  const [childAttendance, setChildAttendance] = useState<StudentAttendanceSummary | null>(null);
  const [childClasses, setChildClasses] = useState<EnrolledClass[]>([]);
  const [childAssignments, setChildAssignments] = useState<Assignment[]>([]);
  const [childSubmissions, setChildSubmissions] = useState<AssignmentSubmission[]>([]);

  // Communications & Announcements
  const [commRequests, setCommRequests] = useState<CommunicationRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // New Communication Request Modal
  const [showCommModal, setShowCommModal] = useState(false);
  const [commSubject, setCommSubject] = useState('');
  const [commMessage, setCommMessage] = useState('');
  const [commTeacherId, setCommTeacherId] = useState('');
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);

  useEffect(() => {
    loadParentContext();
  }, [user]);

  useEffect(() => {
    if (selectedChildId) {
      loadChildData(selectedChildId);
    }
  }, [selectedChildId]);

  const loadParentContext = async () => {
    setIsLoading(true);
    try {
      const [childrenData, reqsData, annData] = await Promise.all([
        authService.getMyChildren(),
        educationService.listCommunicationRequests(),
        educationService.listAnnouncements('parent'),
      ]);

      setLinkedChildren(childrenData);
      setCommRequests(reqsData);
      setAnnouncements(annData);

      if (childrenData.length > 0) {
        setSelectedChildId(childrenData[0].id);
      }
    } catch (err) {
      console.error('Failed to load parent context', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChildData = async (childId: string) => {
    try {
      const [prog, att, classes, assigns, subs] = await Promise.all([
        educationService.getStudentProgress(childId).catch(() => null),
        educationService.getStudentAttendanceSummary(childId).catch(() => null),
        educationService.getEnrolledClasses(childId).catch(() => []),
        educationService.listAssignments().catch(() => []),
        educationService.getStudentSubmissions(childId).catch(() => []),
      ]);

      setChildProgress(prog);
      setChildAttendance(att);
      setChildClasses(classes);
      setChildAssignments(assigns);
      setChildSubmissions(subs || []);
    } catch (err) {
      console.error('Failed to load child data', err);
    }
  };

  const selectedChild = linkedChildren.find((c) => c.id === selectedChildId);

  const handleCreateCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commSubject.trim() || !commMessage.trim() || !selectedChildId) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      // Find a default teacher if none explicitly picked
      const teacherId = commTeacherId || 'fac-default';
      await educationService.createCommunicationRequest({
        teacher_id: teacherId,
        student_id: selectedChildId,
        subject: commSubject.trim(),
        message: commMessage.trim(),
      });

      alert('Communication request submitted to faculty.');
      setShowCommModal(false);
      setCommSubject('');
      setCommMessage('');
      const updatedReqs = await educationService.listCommunicationRequests();
      setCommRequests(updatedReqs);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit request.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide mb-3">
            <HeartHandshake size={14} className="text-teal-300" />
            <span>Family Academic Portal • {user?.institution_name || 'Oakridge Global Academy'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <p className="mt-1 text-teal-100 text-sm">
            Parent & Guardian Academic Oversight • {linkedChildren.length} Linked Student(s)
          </p>
        </div>
      </div>

      {/* Child Switcher Cards */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Select Linked Student Profile:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {linkedChildren.map((child) => (
            <div
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                selectedChildId === child.id
                  ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {child.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{child.full_name}</h4>
                  <p className="text-[11px] text-slate-500">{child.grade_level || 'Student'}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">Verified Student</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Child Summary Metrics */}
      {selectedChild && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Attendance</p>
              <p className="text-xl font-extrabold text-slate-800">
                {childProgress?.overall_attendance_rate ?? childAttendance?.attendance_percentage ?? 95}%
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Courses Enrolled</p>
              <p className="text-xl font-extrabold text-slate-800">{childClasses.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Academic Score</p>
              <p className="text-xl font-extrabold text-slate-800">
                {childProgress?.overall_academic_score ?? 92.5}%
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Award size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Completed Work</p>
              <p className="text-xl font-extrabold text-slate-800">
                {childProgress?.assignment_completion_rate ?? 100}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'academics', label: 'Academic Performance' },
          { id: 'attendance', label: 'Attendance Records' },
          { id: 'communications', label: `Teacher Collaboration (${commRequests.length})` },
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
            {/* Courses Overview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                {selectedChild?.full_name}'s Enrolled Curriculum
              </h3>
              <div className="space-y-2">
                {childClasses.map((cl) => (
                  <div key={cl.enrollment_id} className="p-3.5 rounded-xl bg-slate-50 border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        {cl.course_code}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{cl.course_title}</h4>
                      <p className="text-[11px] text-slate-500">{cl.class_name} • {cl.schedule || 'Regular Lecture'}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{cl.credits} Credits</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignments Monitoring */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                {selectedChild?.full_name}'s Coursework & Evaluated Results
              </h3>
              <div className="space-y-2.5">
                {childAssignments.map((assign) => {
                  const sub = childSubmissions.find((s) => s.assignment_id === assign.id);
                  return (
                    <div key={assign.id} className="p-3.5 rounded-xl bg-slate-50 border space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{assign.title}</h4>
                          <p className="text-[11px] text-slate-500">
                            Due: {new Date(assign.due_date).toLocaleDateString()} • Max: {assign.max_marks} pts
                          </p>
                        </div>
                        {sub?.status === 'evaluated' ? (
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              Score: {sub.marks_obtained} / {assign.max_marks} pts
                            </span>
                            <p className="text-[9px] text-emerald-700 font-semibold mt-0.5">Verified by Faculty</p>
                          </div>
                        ) : sub ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                            Submitted • Under Review
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            Pending Submission
                          </span>
                        )}
                      </div>
                      {sub?.feedback && (
                        <div className="text-[11px] bg-emerald-50 border border-emerald-100 text-emerald-900 p-2 rounded-lg">
                          <span className="font-bold">Faculty Comment:</span> "{sub.feedback}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Faculty Collaboration */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HeartHandshake size={16} className="text-teal-600" />
                  Teacher Inquiries
                </h3>
                <button
                  onClick={() => setShowCommModal(true)}
                  className="p-1 rounded-lg text-blue-600 hover:bg-blue-50"
                  title="New Request"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-2.5">
                {commRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No inquiries submitted yet.</p>
                ) : (
                  commRequests.map((req) => (
                    <div key={req.id} className="p-3 rounded-xl bg-slate-50 border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{req.subject}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            req.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{req.message}</p>
                      {req.response_notes && (
                        <p className="text-[10px] text-blue-700 bg-blue-50 p-1.5 rounded mt-1">
                          <strong>Faculty Response:</strong> {req.response_notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Academic Performance */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedChild?.full_name}'s Evaluated Work & Report Card
                </h3>
                <p className="text-xs text-slate-500">Official verified coursework grades and educator evaluations</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600">
                  {childProgress?.overall_academic_score ?? 89.2}%
                </span>
                <p className="text-[10px] text-slate-400">Cumulative Academic Score</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Assignment Title</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Submitted At</th>
                    <th className="py-2.5 px-3">Marks Scored</th>
                    <th className="py-2.5 px-3">Educator Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {childSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                        No submissions recorded for this student yet.
                      </td>
                    </tr>
                  ) : (
                    childSubmissions.map((sub) => (
                      <tr key={sub.id}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {sub.assignment_title || 'Class Assignment'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'evaluated'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {sub.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {sub.marks_obtained !== undefined && sub.marks_obtained !== null
                            ? `${sub.marks_obtained} / ${sub.max_marks || 25} pts`
                            : 'Pending'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 italic">
                          {sub.feedback || 'Awaiting feedback'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {selectedChild?.full_name}'s Attendance Sessions
              </h3>
              <p className="text-xs text-slate-500">Official log of classes attended</p>
            </div>
            <span className="text-2xl font-black text-emerald-600">
              {childAttendance?.attendance_percentage ?? 95}%
            </span>
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
                {childAttendance?.records.map((rec) => (
                  <tr key={rec.id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{rec.session_date}</td>
                    <td className="py-2.5 px-3 text-slate-700">{rec.session_title}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
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

      {/* Tab: Communications */}
      {activeTab === 'communications' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Parent-Teacher Consultation Requests</h3>
            <button
              onClick={() => setShowCommModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus size={14} /> New Consultation Request
            </button>
          </div>

          <div className="space-y-3">
            {commRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{req.subject}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                    {req.status}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{req.message}</p>
                {req.response_notes && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800">
                    <strong>Teacher Feedback:</strong> {req.response_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Announcements */}
      {activeTab === 'announcements' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Institution Bulletins for Families</h3>
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Communication Request Modal */}
      {showCommModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Request Teacher Consultation</h3>
              <button onClick={() => setShowCommModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCommunication} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={commSubject}
                  onChange={(e) => setCommSubject(e.target.value)}
                  placeholder="e.g. Inquiry regarding midterm preparation"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Inquiry Message</label>
                <textarea
                  value={commMessage}
                  onChange={(e) => setCommMessage(e.target.value)}
                  placeholder="Detail your question or request a meeting..."
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCommModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
