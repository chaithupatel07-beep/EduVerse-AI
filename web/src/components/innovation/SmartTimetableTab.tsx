import React, { useState, useEffect } from 'react';
import innovationService, {
  StudyTimetable,
  StudySession,
  GenerateScheduleRequest,
} from '../../services/innovationService';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Zap,
  Target,
} from 'lucide-react';

export const SmartTimetableTab: React.FC = () => {
  const [timetable, setTimetable] = useState<StudyTimetable | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form State
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [dailyHours, setDailyHours] = useState<number>(3.0);
  const [goal, setGoal] = useState<'balanced' | 'gap_focused' | 'exam_cram'>('gap_focused');

  useEffect(() => {
    loadCurrentTimetable();
  }, []);

  const loadCurrentTimetable = async () => {
    try {
      const data = await innovationService.getCurrentTimetable();
      setTimetable(data);
    } catch (e) {
      console.error('Failed to load current timetable', e);
    }
  };

  const handleGenerateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setActionMessage(null);
    try {
      const req: GenerateScheduleRequest = {
        schedule_title: `Personalized ${goal.replace('_', ' ').toUpperCase()} Plan`,
        daily_available_hours: dailyHours,
        optimization_goal: goal,
        days_ahead: 7,
      };
      const created = await innovationService.generateSmartTimetable(req);
      setTimetable(created);
      setShowGenerateModal(false);
      setActionMessage('New AI Smart Timetable generated with Pomodoro focus blocks!');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to generate smart timetable.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleComplete = async (session: StudySession) => {
    try {
      const updated = await innovationService.toggleSessionCompleted(session.id);
      setTimetable((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) => (s.id === updated.id ? updated : s)),
        };
      });
      if (updated.is_completed) {
        setActionMessage('Session completed! +15 XP earned towards your gamification level.');
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to toggle session status.');
    }
  };

  const handleRescheduleMissed = async () => {
    if (!timetable) return;
    setIsRescheduling(true);
    setActionMessage(null);
    try {
      const res = await innovationService.rescheduleMissedSessions(timetable.id);
      await loadCurrentTimetable();
      setActionMessage(res.message);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to reschedule missed sessions.');
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shadow-lg gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-2">
            <Sparkles size={14} className="text-yellow-300" />
            <span>Phase 6.5 Break-Aware AI Smart Timetable</span>
          </div>
          <h2 className="text-2xl font-black">AI Smart Timetable & Study Scheduler</h2>
          <p className="text-blue-100 text-xs mt-1 max-w-xl">
            Optimizes your daily study schedule using cognitive Pomodoro intervals, prioritizes unresolved
            knowledge gaps, and automatically reallocates missed sessions.
          </p>
        </div>

        <div className="flex gap-2">
          {timetable && (
            <button
              onClick={handleRescheduleMissed}
              disabled={isRescheduling}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-white/20"
            >
              <RotateCcw size={13} className={isRescheduling ? 'animate-spin' : ''} />
              <span>Reschedule Missed</span>
            </button>
          )}

          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Sparkles size={14} />
            <span>{timetable ? 'Re-Optimize Timetable' : 'Generate Timetable'}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-indigo-600" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-indigo-400 hover:text-indigo-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Timetable Sessions Grid */}
      {timetable && timetable.sessions && timetable.sessions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {timetable.schedule_title} ({timetable.sessions.length} Focus Sessions)
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Daily Target: {timetable.daily_available_hours} Hours • Optimization:{' '}
              <span className="capitalize font-bold text-indigo-600">{timetable.optimization_goal}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetable.sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-5 rounded-2xl border transition space-y-3 flex flex-col justify-between ${
                  sess.is_completed
                    ? 'bg-slate-50 border-slate-200 opacity-80'
                    : sess.missed_and_rescheduled
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        sess.priority === 'high'
                          ? 'bg-rose-100 text-rose-700'
                          : sess.priority === 'urgent'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {sess.priority} Priority
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {sess.day_of_week}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{sess.topic_name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{sess.subject_name}</p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2 font-medium">
                    <Clock size={12} className="text-slate-400" />
                    <span>{sess.duration_minutes} min pomodoro</span>
                    <span>•</span>
                    <span className="capitalize">{sess.session_type}</span>
                  </div>

                  {sess.missed_and_rescheduled && (
                    <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md inline-block">
                      Reallocated from missed session
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleComplete(sess)}
                  className={`w-full mt-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                    sess.is_completed
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  <span>{sess.is_completed ? 'Completed (+15 XP)' : 'Mark Completed (+15 XP)'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
          <Calendar size={36} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No active study timetable</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "Generate Timetable" to create an AI-optimized revision schedule targeted to your gaps.
          </p>
        </div>
      )}

      {/* Generate Timetable Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                Configure Smart Timetable
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateTimetable} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Daily Available Study Time
                </label>
                <select
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                >
                  <option value={1.5}>1.5 Hours (Light Focus)</option>
                  <option value={2.5}>2.5 Hours (Balanced Sprint)</option>
                  <option value={3.5}>3.5 Hours (Comprehensive Revision)</option>
                  <option value={5.0}>5.0 Hours (Intensive Exam Prep)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Optimization Strategy</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                >
                  <option value="gap_focused">Target Unresolved Knowledge Gaps</option>
                  <option value="balanced">Balanced Across All Active Courses</option>
                  <option value="exam_cram">Exam Simulation & Practice Heavy</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5"
                >
                  {isGenerating ? 'Generating Schedule...' : 'Generate AI Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartTimetableTab;
