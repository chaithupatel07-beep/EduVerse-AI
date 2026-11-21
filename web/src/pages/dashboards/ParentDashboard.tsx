import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  HeartHandshake,
  GraduationCap,
  CalendarCheck,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState('Alex Chen');

  const childrenData = [
    {
      name: 'Alex Chen',
      grade: 'Grade 11 - STEM Track',
      institution: 'Oakridge Global Academy',
      attendanceRate: '98.5%',
      gpa: '3.92',
      recentCourses: [
        { name: 'AP Physics C: Mechanics', grade: '93%', letter: 'A', teacher: 'Dr. Sarah Jenkins' },
        { name: 'Intro to Machine Learning', grade: '89%', letter: 'B+', teacher: 'Prof. Vance' },
        { name: 'Multivariable Calculus', grade: '96%', letter: 'A', teacher: 'Dr. Bell' },
      ],
      recentTeacherNote: {
        author: 'Dr. Sarah Jenkins (Physics)',
        date: 'Yesterday, 3:15 PM',
        message: 'Alex demonstrated outstanding grasp of angular momentum conservation in the lab session today. Strongly recommend entering the National STEM Olympiad.',
      },
    },
  ];

  const currentChild = childrenData[0];

  return (
    <div className="space-y-6">
      {/* Parent Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-semibold mb-3">
            <HeartHandshake size={14} className="text-purple-300" />
            <span>Family Portal • Student Progress & Collaboration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <p className="mt-2 text-sm text-purple-100 leading-relaxed">
            Viewing real-time academic records, attendance indicators, and direct teacher communications for <span className="font-semibold text-white">{currentChild.name}</span>.
          </p>
        </div>
      </div>

      {/* Child Profile & Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Attendance Rate</span>
            <CalendarCheck size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{currentChild.attendanceRate}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Excellent Standing</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Cumulative GPA</span>
            <TrendingUp size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{currentChild.gpa}</p>
          <p className="text-[11px] text-slate-500 mt-1">Unweighted 4.0 Scale</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Enrolled Classes</span>
            <GraduationCap size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">3</p>
          <p className="text-[11px] text-slate-500 mt-1">All STEM advanced</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Recent Alerts</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">All Good</p>
          <p className="text-[11px] text-slate-500 mt-1">0 missed deadlines</p>
        </div>
      </div>

      {/* Main Split: Course Performance & Teacher Communications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Child Academic Snapshot */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Course Grades & Standings</h2>
            <span className="text-xs font-semibold text-slate-500">Term 1 • 2026</span>
          </div>

          <div className="space-y-3">
            {currentChild.recentCourses.map((c, i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Instructor: {c.teacher}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-extrabold text-sm">
                    {c.letter} ({c.grade})
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Teacher Collaboration Note */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3">
              <MessageSquare size={16} className="text-blue-600" />
              <span>Direct Educator Communication</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                <span>{currentChild.recentTeacherNote.author}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {currentChild.recentTeacherNote.date}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                "{currentChild.recentTeacherNote.message}"
              </p>
            </div>
          </div>
        </div>

        {/* AI Parent Summary Insights */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">AI Student Insights</h2>

          <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 rounded-3xl p-5 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 text-purple-700 font-bold text-sm mb-2">
              <Sparkles size={18} />
              <span>Personalized AI Brief</span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Synthesized by EduVerse AI based on recent assignment scores, study habits, and attendance:
            </p>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-xs">
                <p className="font-semibold text-slate-900 mb-1">Physics & STEM Strength</p>
                <p className="text-[11px] text-slate-600">
                  Alex's problem-solving scores are consistently above 90%. He completed 4 extra practice problem sets this week.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-xs">
                <p className="font-semibold text-slate-900 mb-1">Recommended Support</p>
                <p className="text-[11px] text-slate-600">
                  Calculus midterm is scheduled in 10 days. Ensure a quiet study environment during evening study blocks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
