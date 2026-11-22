import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  BookOpen,
  Users,
  HeartHandshake,
  Flame,
} from 'lucide-react';

interface LoginProps {
  onNavigate: (view: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login, loginWithFirebase, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'standard' | 'firebase'>('standard');
  const [firebaseTokenInput, setFirebaseTokenInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFirebaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const token = firebaseTokenInput.trim() || 'mock-firebase:demo-user-001:alex.chen@eduverse.io:Alex Chen';
    setIsSubmitting(true);
    try {
      await loginWithFirebase(token);
      onNavigate('dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Firebase token verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.pass);
    setLocalError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await login(creds.email, creds.pass);
      onNavigate('dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand Narrative & Quick Access */}
        <div className="lg:col-span-6 text-white space-y-6 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-semibold backdrop-blur-sm">
            <Sparkles size={14} />
            <span>EduVerse AI • Enterprise Security & RBAC</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Intelligent, Role-Governed Education Ecosystem
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed">
            Role authorization is verified authoritatively by PostgreSQL and Firebase Admin SDK on every request. Client roles are never blindly trusted.
          </p>

          {/* Quick Role Access Portals */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-md space-y-3">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Portal Role Accounts</span>
              <span className="text-[10px] text-blue-400 font-normal">Verified Institution Profiles</span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                disabled={isSubmitting}
                className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-left transition group"
              >
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                  <GraduationCap size={15} />
                  <span>Student Portal</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Alex Chen (3rd Year AI)</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('teacher')}
                disabled={isSubmitting}
                className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition group"
              >
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <BookOpen size={15} />
                  <span>Faculty Portal</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Dr. Sarah Jenkins</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('parent')}
                disabled={isSubmitting}
                className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-left transition group"
              >
                <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                  <HeartHandshake size={15} />
                  <span>Parent Portal</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Marcus Chen (Verified)</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={isSubmitting}
                className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition group"
              >
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <Shield size={15} />
                  <span>Admin Portal</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Dean Elena Rostova</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Box */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-indigo-950/50 border border-slate-100">
            
            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('standard')}
                className={`flex-1 py-2 rounded-lg transition ${
                  activeTab === 'standard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('firebase')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'firebase' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Flame size={14} className="text-orange-500" />
                <span>Firebase Auth Token</span>
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {activeTab === 'standard' ? 'Sign In to EduVerse' : 'Firebase Token Exchange'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === 'standard'
                  ? 'Access your role-specific dashboard with authorized credentials.'
                  : 'Backend verifies Firebase JWT claims and retrieves authoritative PostgreSQL role.'}
              </p>
            </div>

            {(localError || error) && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{localError || error}</span>
              </div>
            )}

            {activeTab === 'standard' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@eduverse.io"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => onNavigate('forgot-password')}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In with Credentials</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleFirebaseSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Firebase ID Token</label>
                  <textarea
                    rows={3}
                    value={firebaseTokenInput}
                    onChange={(e) => setFirebaseTokenInput(e.target.value)}
                    placeholder="Paste Firebase JWT or use format: mock-firebase:alex-101:student@eduverse.io:Alex Chen"
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Leave blank to test with pre-configured mock token payload verified by the backend.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying via Firebase Admin...</span>
                    </>
                  ) : (
                    <>
                      <Flame size={15} />
                      <span>Verify Firebase Token & Authenticate</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Don't have an account?</span>
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="font-bold text-blue-600 hover:underline"
              >
                Register with Role Profile
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
