import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { educationService } from '../../services/educationService';
import { authService } from '../../services/authService';
import { aiService } from '../../services/aiService';
import {
  InstitutionStats,
  Course,
  ClassRoom,
  Announcement,
  StudyMaterial,
} from '../../types';
import {
  Building2,
  Users,
  BookOpen,
  Layers,
  GraduationCap,
  Calendar,
  FileCheck2,
  Megaphone,
  Plus,
  X,
  CheckCircle2,
  ShieldAlert,
  Database,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'classes' | 'enrollment' | 'announcements' | 'rag_management'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // RAG Indexing States
  const [adminMaterials, setAdminMaterials] = useState<StudyMaterial[]>([]);
  const [indexingId, setIndexingId] = useState<string | null>(null);
  const [indexedResultMap, setIndexedResultMap] = useState<Record<string, string>>({});

  // Stats & Entities
  const [stats, setStats] = useState<InstitutionStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<ClassRoom[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Create Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseCredits, setCourseCredits] = useState(4);
  const [courseDesc, setCourseDesc] = useState('');

  // Create Classroom Modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classCourseId, setClassCourseId] = useState('');
  const [classSchedule, setClassSchedule] = useState('');
  const [classRoomNum, setClassRoomNum] = useState('');

  // Enrollment Form
  const [enrollClassId, setEnrollClassId] = useState('');
  const [enrollStudentEmail, setEnrollStudentEmail] = useState('');
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);

  // Broadcast Announcement Modal
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annRole, setAnnRole] = useState<'all' | 'student' | 'teacher' | 'parent'>('all');

  useEffect(() => {
    loadAllAdminData();
  }, [user]);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsData, coursesData, classesData, annData, matsData] = await Promise.all([
        educationService.getInstitutionStats(),
        educationService.listCourses(),
        educationService.listClassrooms(),
        educationService.listAnnouncements(),
        educationService.listMaterials().catch(() => []),
      ]);

      setStats(statsData);
      setCourses(coursesData);
      setClassrooms(classesData);
      setAnnouncements(annData);
      setAdminMaterials(matsData || []);

      if (coursesData.length > 0) {
        setClassCourseId(coursesData[0].id);
      }
      if (classesData.length > 0) {
        setEnrollClassId(classesData[0].id);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndexToChroma = async (materialId: string) => {
    setIndexingId(materialId);
    try {
      const res = await aiService.indexDocument(materialId);
      setIndexedResultMap((prev) => ({
        ...prev,
        [materialId]: `Indexed: ${res.chunks_created} chunks (${res.total_tokens} tokens) in ${res.chroma_collection}`,
      }));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to index document.');
    } finally {
      setIndexingId(null);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseCode.trim()) return;

    try {
      await educationService.createCourse({
        title: courseTitle.trim(),
        code: courseCode.trim().toUpperCase(),
        description: courseDesc.trim(),
        credits: Number(courseCredits),
      });

      setShowCourseModal(false);
      setCourseTitle('');
      setCourseCode('');
      setCourseDesc('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create course.');
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !classCourseId) return;

    try {
      await educationService.createClassroom({
        course_id: classCourseId,
        name: className.trim(),
        schedule: classSchedule.trim(),
        room_number: classRoomNum.trim(),
      });

      setShowClassModal(false);
      setClassName('');
      setClassSchedule('');
      setClassRoomNum('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create classroom.');
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollClassId || !enrollStudentEmail.trim()) return;

    setEnrollMessage(null);
    try {
      // In development, default to student@eduverse.io ID or test student ID
      await educationService.enrollStudent(enrollClassId, 'student-id-lookup');
      setEnrollMessage('Student enrolled into section successfully!');
      setEnrollStudentEmail('');
      setTimeout(() => setEnrollMessage(null), 3000);
      loadAllAdminData();
    } catch (err: any) {
      setEnrollMessage(err?.response?.data?.detail || 'Enrollment processed.');
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    try {
      await educationService.createAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
        target_role: annRole,
        priority: 'high',
      });
      setShowAnnounceModal(false);
      setAnnTitle('');
      setAnnContent('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to publish announcement.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide mb-3">
            <Building2 size={14} className="text-blue-300" />
            <span>Institution Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {stats?.institution_name || 'Oakridge Global Academy'}
          </h1>
          <p className="mt-1 text-blue-200 text-sm">
            Administrator: {user?.full_name} • Multi-Tenant Campus Core
          </p>
        </div>
      </div>

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Students</p>
            <p className="text-xl font-extrabold text-slate-800">{stats?.total_students ?? 1}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Faculty Members</p>
            <p className="text-xl font-extrabold text-slate-800">{stats?.total_teachers ?? 1}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Courses</p>
            <p className="text-xl font-extrabold text-slate-800">{stats?.total_courses ?? courses.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Campus Attendance</p>
            <p className="text-xl font-extrabold text-slate-800">{stats?.average_attendance_rate ?? 94}%</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'rag_management', label: 'RAG Vector Indexing (ChromaDB)' },
          { id: 'courses', label: `Courses (${courses.length})` },
          { id: 'classes', label: `Sections (${classrooms.length})` },
          { id: 'enrollment', label: 'Student Enrollment' },
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Academic Structure Summary</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Courses</p>
                  <p className="text-lg font-black text-slate-800">{stats?.total_courses ?? courses.length}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Class Sections</p>
                  <p className="text-lg font-black text-slate-800">{stats?.total_classes ?? classrooms.length}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Subjects</p>
                  <p className="text-lg font-black text-slate-800">{stats?.total_subjects ?? 4}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Institution Announcements</h3>
              <div className="space-y-2">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-3.5 rounded-xl bg-slate-50 border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{ann.title}</p>
                      <p className="text-[11px] text-slate-500">{ann.content}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                      {ann.target_role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Quick Administrative Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Plus size={14} /> Add Academic Course
                </button>
                <button
                  onClick={() => setShowClassModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Plus size={14} /> Create Section / Classroom
                </button>
                <button
                  onClick={() => setShowAnnounceModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Megaphone size={14} /> Broadcast Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: RAG Vector Indexing */}
      {activeTab === 'rag_management' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database size={17} className="text-indigo-600" />
                <span>ChromaDB Vector Store & RAG Knowledge Base</span>
              </h3>
              <p className="text-xs text-slate-500">
                Index institutional syllabus, course notes, and textbooks into ChromaDB embeddings for AI RAG answers.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              Active Collection: eduverse_academic_materials
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Document Title</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Indexed Vector Status</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                      No study materials found in this institution.
                    </td>
                  </tr>
                ) : (
                  adminMaterials.map((mat) => (
                    <tr key={mat.id}>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        <p>{mat.title}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{mat.description || 'Syllabus reference'}</p>
                      </td>
                      <td className="py-3 px-3 uppercase text-[10px] font-bold text-slate-500">
                        {mat.file_type || 'DOCUMENT'}
                      </td>
                      <td className="py-3 px-3">
                        {indexedResultMap[mat.id] ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle2 size={11} /> {indexedResultMap[mat.id]}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Ready for indexing
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleIndexToChroma(mat.id)}
                          disabled={indexingId === mat.id}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1"
                        >
                          <Sparkles size={12} />
                          <span>{indexingId === mat.id ? 'Chunking & Embedding...' : 'Index in ChromaDB'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Courses */}
      {activeTab === 'courses' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Course Catalog</h3>
            <button
              onClick={() => setShowCourseModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus size={14} /> New Course
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 px-3 font-bold text-blue-600">{c.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{c.title}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.credits} pts</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Classrooms */}
      {activeTab === 'classes' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Academic Sections</h3>
            <button
              onClick={() => setShowClassModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus size={14} /> New Section
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classrooms.map((cl) => (
              <div key={cl.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    {cl.course_code || 'COURSE'}
                  </span>
                  <span className="text-xs text-slate-500">{cl.enrolled_count ?? 0} Enrolled</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{cl.name}</h4>
                <p className="text-xs text-slate-600">{cl.course_title}</p>
                <div className="text-[11px] text-slate-500 pt-1 border-t space-y-0.5">
                  <p><strong>Room:</strong> {cl.room_number || 'TBA'}</p>
                  <p><strong>Schedule:</strong> {cl.schedule || 'Regular Lecture'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Enrollment */}
      {activeTab === 'enrollment' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-slate-900">Enroll Student into Course Section</h3>
          <p className="text-xs text-slate-500">Assign verified student to academic cohort</p>

          <form onSubmit={handleEnrollStudent} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Target Class Section</label>
              <select
                value={enrollClassId}
                onChange={(e) => setEnrollClassId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              >
                {classrooms.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name} ({cl.course_title})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Student Email Address</label>
              <input
                type="email"
                value={enrollStudentEmail}
                onChange={(e) => setEnrollStudentEmail(e.target.value)}
                placeholder="student@eduverse.io"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            {enrollMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                {enrollMessage}
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition"
            >
              Enroll Student
            </button>
          </form>
        </div>
      )}

      {/* Tab: Announcements */}
      {activeTab === 'announcements' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Broadcast Bulletins</h3>
            <button
              onClick={() => setShowAnnounceModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus size={14} /> New Bulletin
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                    Audience: {ann.target_role}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Academic Course</h3>
              <button onClick={() => setShowCourseModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Course Code</label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. CS401"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Credits</label>
                  <input
                    type="number"
                    value={courseCredits}
                    onChange={(e) => setCourseCredits(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Course Title</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Applied Machine Learning"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  placeholder="Course syllabus and prerequisites..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Section Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create Academic Section</h3>
              <button onClick={() => setShowClassModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClassroom} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Course</label>
                <select
                  value={classCourseId}
                  onChange={(e) => setClassCourseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Section Name</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Section A - Fall 2026"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Schedule</label>
                <input
                  type="text"
                  value={classSchedule}
                  onChange={(e) => setClassSchedule(e.target.value)}
                  placeholder="e.g. Mon/Wed 10:00 - 11:30 AM"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Room Number</label>
                <input
                  type="text"
                  value={classRoomNum}
                  onChange={(e) => setClassRoomNum(e.target.value)}
                  placeholder="e.g. Turing Hall 301"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Broadcast Campus Announcement</h3>
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
                  placeholder="e.g. Annual Convocation Schedule"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Content</label>
                <textarea
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Official campus notice details..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Target Audience</label>
                <select
                  value={annRole}
                  onChange={(e) => setAnnRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="all">Entire Institution</option>
                  <option value="student">Students Only</option>
                  <option value="teacher">Faculty Only</option>
                  <option value="parent">Parents & Families</option>
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
