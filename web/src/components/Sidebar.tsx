import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  FileCheck2,
  CalendarDays,
  Users,
  GraduationCap,
  Sparkles,
  BarChart3,
  Building2,
  ShieldCheck,
  User,
  HeartHandshake,
  Activity,
  Layers,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  const roleNavItems: Record<string, NavItem[]> = {
    student: [
      { id: 'foundation', label: 'Ecosystem Overview', icon: Layers },
      { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
      { id: 'courses', label: 'My Enrolled Courses', icon: BookOpen },
      { id: 'ai-tutor', label: 'AI Study Assistant (RAG)', icon: Bot, badge: 'AI' },
      { id: 'quizzes', label: 'Quizzes & Practice', icon: FileCheck2 },
      { id: 'study-plan', label: 'Personalized Study Plan', icon: CalendarDays },
      { id: 'profile', label: 'Student Profile', icon: User },
    ],
    teacher: [
      { id: 'foundation', label: 'Ecosystem Overview', icon: Layers },
      { id: 'dashboard', label: 'Educator Dashboard', icon: LayoutDashboard },
      { id: 'classes', label: 'Classrooms & Students', icon: Users },
      { id: 'curriculum', label: 'Curriculum & Resources', icon: BookOpen },
      { id: 'ai-generator', label: 'AI Quiz & Lesson Plan', icon: Sparkles, badge: 'AI' },
      { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
      { id: 'profile', label: 'Faculty Profile', icon: User },
    ],
    parent: [
      { id: 'foundation', label: 'Ecosystem Overview', icon: Layers },
      { id: 'dashboard', label: 'Family Dashboard', icon: LayoutDashboard },
      { id: 'children', label: 'Linked Student Profiles', icon: GraduationCap },
      { id: 'academics', label: 'Academic Performance', icon: BarChart3 },
      { id: 'communications', label: 'Teacher Collaboration', icon: HeartHandshake },
      { id: 'profile', label: 'Parent Profile', icon: User },
    ],
    admin: [
      { id: 'foundation', label: 'Ecosystem Overview', icon: Layers },
      { id: 'dashboard', label: 'Institutional Dashboard', icon: LayoutDashboard },
      { id: 'institutions', label: 'Institution Management', icon: Building2 },
      { id: 'users', label: 'User Directory & RBAC', icon: Users },
      { id: 'system-health', label: 'System Health & Audits', icon: Activity },
      { id: 'security', label: 'Access Control Policies', icon: ShieldCheck },
      { id: 'profile', label: 'Admin Profile', icon: User },
    ],
  };

  const items = roleNavItems[user.role] || roleNavItems.student;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Institution Header Snapshot */}
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institution</p>
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user.institution_name || 'Oakridge Global Academy'}
            </p>
            <p className="text-[10px] text-slate-500">ID: {user.institution_id ? user.institution_id.slice(0, 8) : 'OGA-2026'}</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Navigation
            </p>
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-blue-500 text-white' : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Phase 1 Ecosystem Note */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
          <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1">
            <ShieldCheck size={14} />
            <span className="text-[11px] font-bold">Phase 1 Foundation</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Architecture Ready • 4 Roles Synchronized
          </p>
        </div>
      </aside>
    </>
  );
};
