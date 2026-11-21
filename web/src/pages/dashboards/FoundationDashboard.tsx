import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ConnectionStatus } from '../../components/ConnectionStatus';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import {
  GraduationCap,
  BookOpen,
  HeartHandshake,
  Shield,
  Layers,
  ArrowRight,
  Database,
  CheckCircle2,
  Clock,
  Sparkles,
  Server,
  Activity,
  Code2,
} from 'lucide-react';

interface FoundationDashboardProps {
  onNavigate: (view: string) => void;
}

export const FoundationDashboard: React.FC<FoundationDashboardProps> = ({ onNavigate }) => {
  const { user, quickSwitchRole } = useAuth();

  const roleOverviewCards = [
    {
      role: 'student' as const,
      title: 'Student Portal',
      demoUser: 'Alex Chen',
      subtitle: 'Grade 11 - STEM Track',
      color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-950',
      icon: GraduationCap,
      iconColor: 'text-emerald-600',
      description: 'Personalized study paths, streak tracking, interactive quiz review, and AI study companion.',
    },
    {
      role: 'teacher' as const,
      title: 'Educator Portal',
      demoUser: 'Dr. Sarah Jenkins',
      subtitle: 'Physics & AI Faculty',
      color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-950',
      icon: BookOpen,
      iconColor: 'text-blue-600',
      description: 'Classroom management, student performance rosters, grading workflows, and AI lesson plan generator.',
    },
    {
      role: 'parent' as const,
      title: 'Family Portal',
      demoUser: 'Marcus Chen',
      subtitle: 'Parent of Alex Chen',
      color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-950',
      icon: HeartHandshake,
      iconColor: 'text-purple-600',
      description: 'Real-time attendance rates, GPA tracking, direct teacher communications, and student progress summaries.',
    },
    {
      role: 'admin' as const,
      title: 'Administration',
      demoUser: 'Dean Eleanor Vance',
      subtitle: 'Oakridge Global Academy',
      color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-950',
      icon: Shield,
      iconColor: 'text-amber-600',
      description: 'Campus governance, user directory, institutional RBAC policies, and real-time backend health monitoring.',
    },
  ];

  const sampleActivity = [
    {
      id: 'act-1',
      title: 'Phase 1 Architecture Initialized',
      detail: 'FastAPI Backend, SQLAlchemy 2.0 ORM, and React 18 Web App successfully linked.',
      time: 'Just now',
      badge: 'Core Framework',
    },
    {
      id: 'act-2',
      title: 'Sample Seed Fixture Generated',
      detail: 'Oakridge Global Academy and 4 role demo accounts seeded into database.',
      time: '15 mins ago',
      badge: 'Database Seed',
    },
    {
      id: 'act-3',
      title: 'RBAC Security Verified',
      detail: 'Role guard dependencies validated with 12 automated Pytest unit tests.',
      time: '30 mins ago',
      badge: 'Automated Tests',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-3">
            <Layers size={14} className="text-sky-300" />
            <span>Phase 1: Project Foundation & Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            EduVerse AI Ecosystem
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed">
            An Intelligent, Personalized, and Collaborative Education Ecosystem Powered by Generative AI.
            Currently connected as <span className="font-bold text-white capitalize">{user?.full_name || 'Guest User'}</span> ({user?.role || 'Guest'}).
          </p>
        </div>
      </div>

      {/* Live Backend Connection Status */}
      <ConnectionStatus />

      {/* 4 Ecosystem Role Quick Access */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Connected Ecosystem Roles</h2>
            <p className="text-xs text-slate-500">
              Phase 1 foundation connects 4 user roles with strict Role-Based Access Control:
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
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{card.demoUser}</p>
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

      {/* Phase 1 Architecture & Sample Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Foundation Architecture Highlights */}
        <Card
          className="lg:col-span-2"
          title="Phase 1 Foundation Architecture"
          subtitle="Enterprise-grade full-stack standards ready for Phases 2–7"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Code2 size={16} className="text-blue-600" />
                <span>Modern React 18 Web App</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                TypeScript, Vite, Tailwind CSS, Lucide icons, centralized Axios interceptors with automated token refresh.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Server size={16} className="text-indigo-600" />
                <span>FastAPI Python Backend</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Pydantic v2 schemas, REST endpoints under <code className="bg-slate-200 px-1 rounded">/api/v1</code>, and OpenAPI /docs generation.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Database size={16} className="text-emerald-600" />
                <span>SQLAlchemy 2.0 Async ORM</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                PostgreSQL asyncpg engine, connection pooling, Alembic migrations, and schema definition in <code className="bg-slate-200 px-1 rounded">database/schema.sql</code>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Shield size={16} className="text-amber-600" />
                <span>RBAC & Security Engine</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Salted Bcrypt password hashing, cryptographic HS256 JWT tokens, and strict role guards on all protected resources.
              </p>
            </div>
          </div>
        </Card>

        {/* Sample Activity Log */}
        <Card
          title="Recent Development Activity"
          subtitle="Identified sample test activity log"
        >
          <div className="space-y-3">
            {sampleActivity.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">{act.title}</span>
                  <span className="text-[10px] text-slate-400">{act.time}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed mb-2">{act.detail}</p>
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {act.badge}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
