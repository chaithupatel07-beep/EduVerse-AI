import React, { useState } from 'react';
import { MailCheck, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EmailVerificationProps {
  onNavigate: (view: string) => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isResent, setIsResent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleResend = async () => {
    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSending(false);
    setIsResent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-center">
        
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <MailCheck size={32} />
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">Verify Your Email Address</h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          We sent a verification link to <span className="font-semibold text-slate-700">{user?.email || 'your registered email'}</span>. Please confirm your email to activate all collaborative features.
        </p>

        {isResent && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 size={16} />
            <span>Verification email re-sent successfully!</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={isSending}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} className={isSending ? 'animate-spin' : ''} />
            <span>Resend Verification Link</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
          >
            Continue to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
