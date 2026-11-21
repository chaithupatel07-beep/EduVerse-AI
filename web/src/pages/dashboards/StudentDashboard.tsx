import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Bot,
  Flame,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [askAiQuery, setAskAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const courses = [
    {
      id: 'c1',
      title: 'AP Physics C: Mechanics & Electromagnetism',
      instructor: 'Dr. Sarah Jenkins',
      progress: 78,
      nextDeadline: 'Problem Set 4 due Tomorrow',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      id: 'c2',
      title: 'Introduction to Machine Learning & RAG',
      instructor: 'Prof. David Vance',
      progress: 64,
      nextDeadline: 'Vector Embeddings Quiz in 3 days',
      color: 'from-purple-600 to-pink-600',
    },
    {
      id: 'c3',
      title: 'Multivariable Calculus & Linear Algebra',
      instructor: 'Dr. Katherine Bell',
      progress: 92,
      nextDeadline: 'Midterm Review Complete',
      color: 'from-emerald-600 to-teal-600',
    },
  ];

  const handleAskAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askAiQuery.trim()) return;

    setIsAiLoading(true);
    setAiAnswer(null);

    // Realistic simulation of Phase 1 preview grounded in course materials
    setTimeout(() => {
      setAiAnswer(
        `Based on Oakridge AP Physics C syllabus (Chapter 4 - Rotational Dynamics): Torque is the rotational equivalent of linear force (τ = r × F). In your upcoming lab, remember to calculate moment of inertia about the center of mass first.`
      );
      setIsAiLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-3">
            <Flame size={14} className="text-amber-400" />
            <span>7-Day Learning Streak Active!</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">
            You are enrolled in <span className="font-semibold text-white">3 active STEM courses</span>. Your personalized AI companion is ready to help you prepare for upcoming reviews.
          </p>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Streak</span>
            <Flame size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">7 Days</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Top 5% of your class</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Average Grade</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">93.4%</p>
          <p className="text-[11px] text-slate-500 mt-1">GPA 3.92 Equivalent</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Completed Quizzes</span>
            <Award size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">18 / 20</p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">2 remaining this unit</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Hours Studied</span>
            <Clock size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">24.5 hrs</p>
          <p className="text-[11px] text-slate-500 mt-1">This month</p>
        </div>
      </div>

      {/* Main Content Split: Courses & AI Assistant Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Enrolled Courses</h2>
            <span className="text-xs font-semibold text-blue-600">3 Courses Enrolled</span>
          </div>

          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Instructor: {course.instructor}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {course.progress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full bg-gradient-to-r ${course.color} rounded-full`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                    <Clock size={13} />
                    {course.nextDeadline}
                  </span>
                  <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold">
                    <span>Continue Unit</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Study Assistant Quick Preview Widget */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">AI Learning Companion</h2>

          <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 rounded-3xl p-5 border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-2">
              <Bot size={18} />
              <span>EduVerse AI Tutor (RAG Grounded)</span>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Ask any question about your course materials or study guides:
            </p>

            <form onSubmit={handleAskAi} className="space-y-3">
              <textarea
                value={askAiQuery}
                onChange={(e) => setAskAiQuery(e.target.value)}
                placeholder="e.g. What is the formula for angular momentum and how does torque relate to it?"
                rows={3}
                className="w-full p-3 text-xs rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm"
              />

              <button
                type="submit"
                disabled={isAiLoading || !askAiQuery.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {isAiLoading ? (
                  <span>Searching Course Embeddings...</span>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Ask AI Companion</span>
                  </>
                )}
              </button>
            </form>

            {aiAnswer && (
              <div className="mt-4 p-3.5 rounded-2xl bg-white border border-indigo-100 text-xs text-slate-800 shadow-sm">
                <div className="flex items-center gap-1 text-indigo-700 font-bold text-[11px] mb-1">
                  <Sparkles size={12} />
                  <span>Answer (Source: Oakridge Physics Syllabus)</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{aiAnswer}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
