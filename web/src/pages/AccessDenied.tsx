import React from 'react';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccessDeniedProps {
  onNavigate: (view: string) => void;
  requiredRole?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ onNavigate, requiredRole }) => {
  const { user, quickSwitchRole } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-center">
        
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold mb-3">
          <span>HTTP 403 Forbidden</span>
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted by RBAC</h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Your current authenticated role is <span className="font-bold text-slate-800 uppercase">{user?.role || 'Guest'}</span>.
          {requiredRole ? ` This module requires the '${requiredRole}' role.` : ' You do not possess the required permissions.'}
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Return to Permitted Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  );
};
