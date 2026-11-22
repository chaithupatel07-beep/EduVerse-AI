import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import {
  GraduationCap,
  BookOpen,
  HeartHandshake,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  Flame,
  Brain,
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Target,
  Trophy,
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface FoundationDashboardProps {
  onNavigate: (view: string) => void;
}

export const FoundationDashboard: React.FC<FoundationDashboardProps> = ({ onNavigate }) => {
  const { user, quickSwitchRole } = useAuth();

  // Interactive Animated Focus Timer State
  const [focusSeconds, setFocusSeconds] = useState(1500); // 25 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeSubject, setActiveSubject] = useState('Machine Learning & Vector Embeddings');

  // Flashcard Deck State
  const flashcards = [
    {
      id: 1,
      subject: 'Physics',
      topic: 'Rotational Dynamics',
      question: 'What is the rotational analog of force in linear mechanics?',
      answer: 'Torque (τ = r × F = I · α), representing rotational tendency.',
      hint: 'Think about angular acceleration.',
    },
    {
      id: 2,
      subject: 'Computer Science',
      topic: 'RAG & Vector Search',
      question: 'How does Cosine Similarity compute relevance between embedding vectors?',
      answer: 'Cosine of the angle between two vectors: cos(θ) = (A · B) / (||A|| ||B||).',
      hint: 'Normalized dot product measuring angular alignment.',
    },
    {
      id: 3,
      subject: 'Mathematics',
      topic: 'Linear Algebra',
      question: 'What is the condition for an n × n matrix to be invertible?',
      answer: 'Its determinant must be non-zero (det(A) ≠ 0) and rank must equal n.',
      hint: 'Relates to non-zero volume scaling and full column rank.',
    },
  ];
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && focusSeconds > 0) {
      interval = setInterval(() => {
        setFocusSeconds((prev) => prev - 1);
      }, 1000);
    } else if (focusSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, focusSeconds]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerProgressPercent = ((1500 - focusSeconds) / 1500) * 100;

  const roleOverviewCards = [
    {
      role: 'student' as const,
      title: 'Student Portal',
      user: 'Alex Chen',
      subtitle: 'Grade 11 - STEM Track',
      color: 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white hover:border-emerald-400 text-emerald-950',
      icon: GraduationCap,
      iconColor: 'text-emerald-600',
      description: 'Personalized study paths, streak tracking, interactive quiz review, and AI study companion.',
    },
    {
      role: 'teacher' as const,
      title: 'Educator Portal',
      user: 'Dr. Sarah Jenkins',
      subtitle: 'Physics & AI Faculty',
      color: 'border-blue-200 bg-gradient-to-br from-blue-50/80 to-white hover:border-blue-400 text-blue-950',
      icon: BookOpen,
      iconColor: 'text-blue-600',
      description: 'Classroom management, student performance rosters, grading workflows, and AI lesson plan generator.',
    },
    {
      role: 'parent' as const,
      title: 'Family Portal',
      user: 'Marcus Chen',
      subtitle: 'Parent of Alex Chen',
      color: 'border-purple-200 bg-gradient-to-br from-purple-50/80 to-white hover:border-purple-400 text-purple-950',
      icon: HeartHandshake,
      iconColor: 'text-purple-600',
      description: 'Real-time attendance rates, GPA tracking, direct teacher communications, and student progress summaries.',
    },
    {
      role: 'admin' as const,
      title: 'Administration',
      user: 'Dean Eleanor Vance',
      subtitle: 'Oakridge Global Academy',
      color: 'border-amber-200 bg-gradient-to-br from-amber-50/80 to-white hover:border-amber-400 text-amber-950',
      icon: Shield,
      iconColor: 'text-amber-600',
      description: 'Campus governance, user directory, institutional RBAC policies, and real-time backend health monitoring.',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner with Animated Particles & Glow */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Animated Background Rings */}
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-blue-500/20 blur-2xl animate-pulse" />
        <div className="absolute right-40 -bottom-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-3">
            <Sparkles size={14} className="text-yellow-300 animate-spin" />
            <span>EduVerse Unified Learning Ecosystem</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome to EduVerse AI
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed">
            An Intelligent, Personalized, and Collaborative Education Ecosystem Powered by Generative AI.
            Currently connected as <span className="font-bold text-white capitalize">{user?.full_name || 'Guest User'}</span> ({user?.role || 'Guest'}).
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
              <Flame size={13} className="text-amber-300 animate-bounce" />
              14-Day Study Streak
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
              <Brain size={13} className="text-emerald-300" />
              Active Knowledge Grounding
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
              <Award size={13} className="text-indigo-200" />
              Telugu, Hindi & English Fluent
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Study Animation Section (Replacing Architecture & Activity Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Animated Study Focus & Pomodoro Timer */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Timer size={20} className={isTimerRunning ? 'animate-spin' : ''} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Focus Study Session</h3>
                <p className="text-[11px] text-slate-500">Pomodoro Interval • Deep Work</p>
              </div>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              isTimerRunning ? 'bg-emerald-50 text-emerald-700 animate-pulse' : 'bg-slate-100 text-slate-600'
            }`}>
              {isTimerRunning ? '● Active Study Session' : 'Paused'}
            </span>
          </div>

          {/* Animated Timer Progress Display */}
          <div className="flex flex-col items-center justify-center my-4 py-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-slate-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-indigo-600 transition-all duration-1000 ease-linear"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * timerProgressPercent) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {formatTimer(focusSeconds)}
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                  {Math.round(timerProgressPercent)}% complete
                </span>
              </div>
            </div>

            {/* Subject Selector Pill */}
            <div className="mt-3 text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Current Focus Topic</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{activeSubject}</p>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm transition-all ${
                isTimerRunning
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              {isTimerRunning ? <Pause size={15} /> : <Play size={15} />}
              <span>{isTimerRunning ? 'Pause Session' : 'Start Focus Session'}</span>
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setFocusSeconds(1500);
              }}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Reset Timer"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Animated Study Flashcards & Quick Quiz Booster */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Brain size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Adaptive Study Flashcard</h3>
                  <p className="text-[11px] text-slate-500">
                    Card {currentCardIndex + 1} of {flashcards.length} • {flashcards[currentCardIndex].subject}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {flashcards[currentCardIndex].topic}
              </span>
            </div>

            {/* Interactive Flippable Card */}
            <div
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="cursor-pointer min-h-[170px] p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/40 border border-indigo-100 flex flex-col justify-between transition-all duration-300 hover:shadow-md relative group"
            >
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                  {isCardFlipped ? 'Concept Verification' : 'Question Prompt'}
                </span>
                <p className="text-sm font-bold text-slate-900 leading-snug">
                  {isCardFlipped
                    ? flashcards[currentCardIndex].answer
                    : flashcards[currentCardIndex].question}
                </p>
              </div>

              <div className="pt-3 border-t border-indigo-100/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                  <HelpCircle size={12} />
                  {isCardFlipped ? 'Click to view question' : 'Click card to reveal answer'}
                </span>
                <span className="italic text-[10px] text-slate-400">
                  Hint: {flashcards[currentCardIndex].hint}
                </span>
              </div>
            </div>
          </div>

          {/* Flashcard Navigation */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              Reinforcing cognitive long-term recall
            </span>
            <button
              onClick={() => {
                setIsCardFlipped(false);
                setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
              }}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition"
            >
              <span>Next Card</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* Live Curriculum Mastery Progress Strip */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Curriculum Mastery Tracker</h3>
              <p className="text-[11px] text-slate-500">Dynamic mastery levels across active course modules</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Overall Cohort Mastery: 88.4%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Advanced AI & RAG Systems</span>
              <span className="font-black text-indigo-600">92%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: '92%' }} />
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-600" />
              Vector Search & Chunking Mastered
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Rotational Dynamics</span>
              <span className="font-black text-amber-600">78%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: '78%' }} />
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <Target size={11} className="text-amber-600" />
              Angular Momentum Practice Scheduled
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Multivariable Calculus</span>
              <span className="font-black text-emerald-600">89%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: '89%' }} />
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-600" />
              Integration & Optimization Verified
            </p>
          </div>
        </div>
      </div>

      {/* 4 Ecosystem Role Quick Access */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Connected Ecosystem Roles</h2>
            <p className="text-xs text-slate-500">
              Select any portal below to enter that role's dedicated environment:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleOverviewCards.map((card) => {
            const Icon = card.icon;
            const isCurrent = user?.role === card.role;

            return (
              <div
                key={card.role}
                className={`rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between ${card.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-xs flex items-center justify-center">
                      <Icon size={20} className={card.iconColor} />
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                        Active Session
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{card.title}</h3>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{card.user}</p>
                  <p className="text-[11px] text-slate-500 mb-3">{card.subtitle}</p>
                  <p className="text-xs text-slate-700 leading-relaxed mb-4">{card.description}</p>
                </div>

                <Button
                  variant={isCurrent ? 'secondary' : 'outline'}
                  size="sm"
                  className="w-full bg-white/90 hover:bg-white text-slate-800"
                  onClick={async () => {
                    await quickSwitchRole(card.role);
                    onNavigate('dashboard');
                  }}
                  rightIcon={<ArrowRight size={13} />}
                >
                  {isCurrent ? 'Open My Workspace' : `Switch to ${card.title}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
