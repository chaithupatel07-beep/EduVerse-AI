import React, { useState, useEffect } from 'react';
import innovationService, {
  GamificationProfile,
  AchievementBadge,
  LeaderboardEntry,
} from '../../services/innovationService';
import {
  Flame,
  Zap,
  Award,
  Trophy,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react';

export const GamificationTab: React.FC = () => {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [achievements, setAchievements] = useState<AchievementBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isTogglingOptIn, setIsTogglingOptIn] = useState<boolean>(false);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      const [profData, achData, leadData] = await Promise.all([
        innovationService.getGamificationProfile(),
        innovationService.getAchievements(),
        innovationService.getLeaderboard(10),
      ]);
      setProfile(profData);
      setAchievements(achData);
      setLeaderboard(leadData);
    } catch (e) {
      console.error('Failed to load gamification data', e);
    }
  };

  const handleToggleOptIn = async () => {
    if (!profile) return;
    setIsTogglingOptIn(true);
    try {
      const updated = await innovationService.toggleLeaderboardOptIn(!profile.leaderboard_opt_in);
      setProfile(updated);
      const lead = await innovationService.getLeaderboard(10);
      setLeaderboard(lead);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to toggle leaderboard status.');
    } finally {
      setIsTogglingOptIn(false);
    }
  };

  if (!profile) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
        Loading Gamification & Achievement Profile...
      </div>
    );
  }

  const nextLevelXp = profile.current_level * 100;
  const currentLevelProgress = (profile.total_xp % 100);

  return (
    <div className="space-y-6">
      {/* Top Profile Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <Trophy size={14} className="text-yellow-300" />
            <span>Verified Academic Gamification</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Level {profile.current_level} • {profile.level_title}
          </h2>
          <p className="text-amber-100 text-xs max-w-md">
            Earn verified XP through objective quiz submissions, mock exam simulations, digitized note
            archival, and completing daily pomodoro sessions.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
            <p className="text-[10px] uppercase font-bold text-amber-200">Total XP</p>
            <p className="text-2xl font-black">{profile.total_xp}</p>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center flex items-center gap-2">
            <Flame size={24} className="text-amber-300 animate-pulse" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-amber-200">Active Streak</p>
              <p className="text-xl font-black">{profile.streak_days} Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bars Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Level Bar */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-800">
            <span>Progress to Level {profile.current_level + 1}</span>
            <span className="text-indigo-600">{currentLevelProgress} / 100 XP</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${currentLevelProgress}%` }}
            />
          </div>
        </div>

        {/* Daily Goal Bar */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-800">
            <span>Today's Learning Goal</span>
            <span className="text-emerald-600">
              {profile.today_xp} / {profile.daily_goal_xp} XP
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (profile.today_xp / profile.daily_goal_xp) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Achievements Gallery */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            <span>Verified Achievement Badges ({achievements.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {achievements.map((badge) => {
              const isEarned = badge.is_earned;
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition space-y-2 flex flex-col justify-between ${
                    isEarned
                      ? 'bg-gradient-to-br from-amber-50/60 to-white border-amber-200 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 uppercase">
                        +{badge.xp_reward} XP
                      </span>
                      {isEarned ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 size={12} /> Earned
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Lock size={12} /> Locked
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{badge.name}</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">{badge.description}</p>
                  </div>

                  <div className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-100">
                    Criteria: {badge.criteria_summary}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Point Transactions */}
          {profile.recent_transactions && profile.recent_transactions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent XP Point Activity
              </h4>
              <div className="space-y-2">
                {profile.recent_transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs"
                  >
                    <span className="text-slate-700 font-medium">{tx.reason}</span>
                    <span className="font-bold text-emerald-600 font-mono">+{tx.amount} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Opt-in Leaderboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              <span>Campus Leaderboard</span>
            </h3>

            <button
              onClick={handleToggleOptIn}
              disabled={isTogglingOptIn}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                profile.leaderboard_opt_in
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {profile.leaderboard_opt_in ? 'Opted In ✓' : 'Opt In'}
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3">
            {leaderboard.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No leaderboard entries yet.</p>
            ) : (
              leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    entry.user_id === profile.user_id
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                        entry.rank === 1
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : entry.rank === 2
                          ? 'bg-slate-300 text-slate-900'
                          : entry.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{entry.display_name}</p>
                      <p className="text-[10px] text-slate-400">
                        {entry.level_title} • {entry.streak_days}d streak
                      </p>
                    </div>
                  </div>

                  <span className="font-extrabold text-xs text-indigo-700 font-mono">
                    {entry.total_xp} XP
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationTab;
