import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onNavigate,
}) => {
  const { user, isAuthenticated, isLoading, quickSwitchRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Verifying authorization & session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (onNavigate) {
      onNavigate('login');
      return null;
    }
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-5">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Restricted Access</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Your current role (<span className="font-semibold text-slate-800">{user.role}</span>) does not have permission to view this portal.
            Required role(s): {allowedRoles.map((r) => `'${r}'`).join(', ')}.
          </p>

          <div className="space-y-3">
            {allowedRoles[0] && (
              <button
                onClick={() => quickSwitchRole(allowedRoles[0])}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm"
              >
                <span>Switch to Demo {allowedRoles[0].toUpperCase()}</span>
                <ArrowRight size={16} />
              </button>
            )}

            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
            >
              Return to My Role Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
