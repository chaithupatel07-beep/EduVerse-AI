import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';
import { Sparkles, Check, ChevronDown, UserCheck, Loader2 } from 'lucide-react';

interface QuickRoleSwitcherProps {
  onRoleSwitched?: () => void;
}

export const QuickRoleSwitcher: React.FC<QuickRoleSwitcherProps> = ({ onRoleSwitched }) => {
  const { user, quickSwitchRole, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<UserRole | null>(null);

  const roles: UserRole[] = ['student', 'teacher', 'parent', 'admin'];

  const handleSelectRole = async (role: UserRole) => {
    if (user?.role === role) {
      setIsOpen(false);
      return;
    }
    setSwitchingTo(role);
    try {
      await quickSwitchRole(role);
      setIsOpen(false);
      if (onRoleSwitched) onRoleSwitched();
    } finally {
      setSwitchingTo(null);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || switchingTo !== null}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 transition shadow-sm"
        title="Instant Role Evaluator - Switch between the 4 ecosystem roles"
      >
        <Sparkles size={14} className="text-indigo-600 animate-pulse" />
        <span>Switch Demo Role</span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl border border-slate-100 p-2 z-50">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Fast Role Switcher</p>
            <p className="text-[11px] text-slate-500">Instantly switch role context & access control</p>
          </div>

          <div className="py-1 space-y-1">
            {roles.map((role) => {
              const creds = DEMO_CREDENTIALS[role];
              const isActive = user?.role === role;
              const isPending = switchingTo === role;

              return (
                <button
                  key={role}
                  onClick={() => handleSelectRole(role)}
                  disabled={isPending}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-slate-100 font-semibold text-slate-900'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        role === 'student'
                          ? 'bg-emerald-500'
                          : role === 'teacher'
                          ? 'bg-blue-500'
                          : role === 'parent'
                          ? 'bg-purple-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{role}</p>
                      <p className="text-[10px] text-slate-500">{creds.title}</p>
                    </div>
                  </div>

                  {isPending ? (
                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                  ) : isActive ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <UserCheck size={13} className="text-slate-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
