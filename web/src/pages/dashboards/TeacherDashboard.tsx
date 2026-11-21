import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  BookOpen,
  Sparkles,
  ClipboardCheck,
  TrendingUp,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [aiTopic, setAiTopic] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const classes = [
    {
      id: 'cls-1',
      name: 'AP Physics C - Period 2',
      grade: 'Grade 11 & 12',
      studentsCount: 28,
      avgGrade: '89.4%',
      pendingGrading: 4,
    },
    {
      id: 'cls-2',
      name: 'Intro to AI & Vector Search - Period 4',
      grade: 'Grade 10 & 11',
      studentsCount: 32,
      avgGrade: '92.1%',
      pendingGrading: 7,
    },
    {
      id: 'cls-3',
      name: 'Physics Honors Lab - Period 6',
      grade: 'Grade 11',
      studentsCount: 24,
      avgGrade: '87.8%',
      pendingGrading: 1,
    },
  ];

  const handleGenerateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setIsGenerating(true);
    setGeneratedPlan(null);

    setTimeout(() => {
      setGeneratedPlan(
        `AI Lesson Outline generated for "${aiTopic}":\n` +
        `1. Hook & Real-World Application (10 min): How generative transformers process multi-modal inputs.\n` +
        `2. Core Theory (20 min): Attention mechanisms, query/key/value matrix multiplications.\n` +
        `3. Hands-on Lab Activity (15 min): Visualizing token embeddings in 2D space.\n` +
        `4. Formative Assessment (10 min): 3 conceptual multiple-choice questions.`
      );
      setIsGenerating(false);
    }, 750);
  };

  return (
    <div className="space-y-6">
      {/* Educator Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-3">
            <BookOpen size={14} className="text-sky-300" />
            <span>Faculty Workspace • {user?.subject_specialization || 'STEM & AI'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">
            Managing <span className="font-semibold text-white">3 active classes</span> across 84 enrolled students. 12 assignments are currently pending evaluation.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Students</span>
            <Users size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">84</p>
          <p className="text-[11px] text-slate-500 mt-1">Across 3 Class Sections</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Grading</span>
            <ClipboardCheck size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">12</p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Submissions waiting review</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Class Avg. Mastery</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">89.8%</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">+3.2% vs last term</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">AI Generated Quizzes</span>
            <Sparkles size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">16</p>
          <p className="text-[11px] text-slate-500 mt-1">Saved 8.5 teaching hours</p>
        </div>
      </div>

      {/* Main Split: Classroom Management & AI Plan Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Active Classroom Sections</h2>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
              <PlusCircle size={15} />
              <span>Create Section</span>
            </button>
          </div>

          <div className="space-y-3">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{cls.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{cls.grade}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    Avg {cls.avgGrade}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} className="text-slate-400" />
                    {cls.studentsCount} Students
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                    <Clock size={14} />
                    {cls.pendingGrading} to grade
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <button className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                      View Roster
                    </button>
                    <button className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                      Open Gradebook
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Lesson & Quiz Generator Assistant */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">AI Curriculum Assistant</h2>

          <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl p-5 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2">
              <Sparkles size={18} />
              <span>Generate Educational Material</span>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Generate structured lesson plans or diagnostic quiz questions aligned with your curriculum:
            </p>

            <form onSubmit={handleGenerateLesson} className="space-y-3">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Electromagnetic Induction & Lenz's Law"
                className="w-full p-2.5 text-xs rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              />

              <button
                type="submit"
                disabled={isGenerating || !aiTopic.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <span>Generating Structured Plan...</span>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate Lesson Plan</span>
                  </>
                )}
              </button>
            </form>

            {generatedPlan && (
              <div className="mt-4 p-3.5 rounded-2xl bg-white border border-blue-100 text-xs text-slate-800 shadow-sm">
                <div className="flex items-center gap-1 text-blue-700 font-bold text-[11px] mb-1.5">
                  <CheckCircle2 size={13} />
                  <span>Draft Ready to Deploy</span>
                </div>
                <pre className="text-slate-700 text-[11px] font-sans whitespace-pre-wrap leading-relaxed">
                  {generatedPlan}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
