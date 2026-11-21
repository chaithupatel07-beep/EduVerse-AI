import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/RoleBadge';
import { authService } from '../services/authService';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [gradeLevel, setGradeLevel] = useState(user?.grade_level || '');
  const [subjectSpecialization, setSubjectSpecialization] = useState(
    user?.subject_specialization || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Live RBAC verification state
  const [rbacTesting, setRbacTesting] = useState(false);
  const [rbacResult, setRbacResult] = useState<any>(null);
  const [rbacError, setRbacError] = useState<string | null>(null);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await updateProfile({
        full_name: fullName,
        phone: phone || undefined,
        bio: bio || undefined,
        grade_level: user.role === 'student' ? gradeLevel : undefined,
        subject_specialization: user.role === 'teacher' ? subjectSpecialization : undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestRbac = async () => {
    setRbacTesting(true);
    setRbacResult(null);
    setRbacError(null);

    try {
      const res = await authService.testRoleAccess(user.role);
      setRbacResult(res);
    } catch (err: any) {
      setRbacError(err.response?.data?.detail || 'RBAC Access Denied.');
    } finally {
      setRbacTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-blue-500/20">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">{user.full_name}</h1>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Building2 size={14} className="text-slate-400" />
                {user.institution_name || 'Oakridge Global Academy'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                Member since {new Date(user.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <ShieldCheck size={14} />
                Verified Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Edit Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Edit Profile Information</h2>

          {saveSuccess && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Your profile has been saved successfully.</span>
            </div>
          )}

          {saveError && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-800">
              <AlertCircle size={16} className="text-red-600" />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="block w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Immutable)
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="block w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="block w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            {user.role === 'student' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grade / Academic Level
                </label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="block w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            )}

            {user.role === 'teacher' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Specialization
                </label>
                <input
                  type="text"
                  value={subjectSpecialization}
                  onChange={(e) => setSubjectSpecialization(e.target.value)}
                  className="block w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bio / Academic Statement
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Brief description about your background, interests, or teaching focus..."
                className="block w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live RBAC Verification Tool */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
              <KeyRound size={18} className="text-blue-600" />
              <span>RBAC Token Verification</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Test your cryptographic JWT access permissions against the backend role-guard:
            </p>

            <button
              onClick={handleTestRbac}
              disabled={rbacTesting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 text-xs font-bold transition shadow-sm"
            >
              {rbacTesting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Checking Server RBAC...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Validate '{user.role.toUpperCase()}' Permission</span>
                </>
              )}
            </button>

            {rbacResult && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
                  <CheckCircle2 size={14} />
                  <span>RBAC Validated!</span>
                </div>
                <pre className="text-[10px] text-emerald-900 font-mono bg-white/70 p-2 rounded-lg overflow-x-auto">
                  {JSON.stringify(rbacResult, null, 2)}
                </pre>
              </div>
            )}

            {rbacError && (
              <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
                <div className="flex items-center gap-1.5 font-bold mb-1 text-red-800">
                  <AlertCircle size={14} />
                  <span>Access Rejected</span>
                </div>
                <p className="text-[11px]">{rbacError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
