import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  GraduationCap,
  BookOpen,
  HeartHandshake,
  Shield,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface RegisterProps {
  onNavigate: (view: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { registerProfile, clearError } = useAuth();
  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [institutionCode, setInstitutionCode] = useState('OGA-2026');

  // Role-Specific Fields
  // Student
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState('3rd Year / Semester 5');
  const [program, setProgram] = useState('B.Tech in Artificial Intelligence');

  // Teacher
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [specialization, setSpecialization] = useState('Machine Learning');

  // Parent
  const [linkedStudentEmail, setLinkedStudentEmail] = useState('');
  const [relationshipType, setRelationshipType] = useState('guardian');

  // Admin
  const [invitationCode, setInvitationCode] = useState('');

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearError();

    if (!fullName || !email || !password) {
      setError('Please provide your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (role === 'admin' && !invitationCode) {
      setError('Administrative registration requires an authorized invitation code (e.g. EDUVERSE-ADMIN-2026).');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Educational Code of Conduct and Terms of Service.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerProfile({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        institution_code: institutionCode.trim().toUpperCase() || undefined,
        phone: phone.trim() || undefined,
        student_id: role === 'student' ? studentId.trim() || undefined : undefined,
        department: role === 'student' || role === 'teacher' ? department : undefined,
        academic_year: role === 'student' ? academicYear : undefined,
        program: role === 'student' ? program : undefined,
        employee_id: role === 'teacher' ? employeeId.trim() || undefined : undefined,
        designation: role === 'teacher' ? designation : undefined,
        specialization: role === 'teacher' ? specialization : undefined,
        linked_student_email: role === 'parent' ? linkedStudentEmail.trim().toLowerCase() || undefined : undefined,
        relationship_type: role === 'parent' ? relationshipType : undefined,
        invitation_code: role === 'admin' ? invitationCode.trim() : undefined,
      });

      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-3xl bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
        
        {/* Header */}
        <div className="text-center max-w-lg mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold mb-2">
            <Sparkles size={13} />
            <span>Multi-Role Academic Onboarding</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Your EduVerse Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose your academic role to personalize permissions, workflows, and AI assistants.
          </p>
        </div>

        {/* Role Selector Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
              role === 'student'
                ? 'bg-blue-50/80 border-blue-500 shadow-sm shadow-blue-500/10'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`p-2 w-fit rounded-xl mb-2 ${role === 'student' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <GraduationCap size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Student</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Courses, AI tutor & quizzes</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
              role === 'teacher'
                ? 'bg-emerald-50/80 border-emerald-500 shadow-sm shadow-emerald-500/10'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`p-2 w-fit rounded-xl mb-2 ${role === 'teacher' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <BookOpen size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Teacher</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Classes & AI curriculum</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole('parent')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
              role === 'parent'
                ? 'bg-purple-50/80 border-purple-500 shadow-sm shadow-purple-500/10'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`p-2 w-fit rounded-xl mb-2 ${role === 'parent' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <HeartHandshake size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Parent</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Family & progress links</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
              role === 'admin'
                ? 'bg-rose-50/80 border-rose-500 shadow-sm shadow-rose-500/10'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`p-2 w-fit rounded-xl mb-2 ${role === 'admin' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Shield size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Institution Admin</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Governance & security</p>
            </div>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Common Account Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@eduverse.io"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1-555-0142"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Code</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={institutionCode}
                  onChange={(e) => setInstitutionCode(e.target.value)}
                  placeholder="e.g. OGA-2026"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Role-Specific Conditional Form Sections */}
          {role === 'student' && (
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
              <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <GraduationCap size={15} />
                <span>Student Academic Profile</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Student Identifier</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. STU-2026-0042"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Academic Year</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1st Year / Semester 1">1st Year / Semester 1</option>
                    <option value="2nd Year / Semester 3">2nd Year / Semester 3</option>
                    <option value="3rd Year / Semester 5">3rd Year / Semester 5</option>
                    <option value="4th Year / Semester 7">4th Year / Semester 7</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Major or Program</label>
                  <input
                    type="text"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="e.g. B.Tech in Artificial Intelligence"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {role === 'teacher' && (
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <BookOpen size={15} />
                <span>Faculty & Academic Credentials</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Faculty / Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. FAC-2026-018"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Academic Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Associate Professor"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subject Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Deep Learning & Natural Language Processing"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {role === 'parent' && (
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
              <p className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <HeartHandshake size={15} />
                <span>Student Guardian Linking</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Child's Student Email</label>
                  <input
                    type="email"
                    value={linkedStudentEmail}
                    onChange={(e) => setLinkedStudentEmail(e.target.value)}
                    placeholder="student@eduverse.io"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">A verification request will be sent to the student.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Relationship</label>
                  <select
                    value={relationshipType}
                    onChange={(e) => setRelationshipType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Legal Guardian</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {role === 'admin' && (
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
              <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <Shield size={15} />
                <span>Administrator Verification Code</span>
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Invitation / Authorization Key</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500" />
                  <input
                    type="text"
                    required
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                    placeholder="e.g. EDUVERSE-ADMIN-2026"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Public signups cannot self-assign Administrator privileges. Use code <code>EDUVERSE-ADMIN-2026</code> for evaluation.
                </p>
              </div>
            </div>
          )}

          {/* Terms Agreement */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to the <span className="font-semibold text-slate-800">Educational Code of Conduct</span> and acknowledge that access is monitored according to my authoritative role.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Registering Account & Role Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Already registered?</span>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="font-bold text-blue-600 hover:underline"
          >
            Back to Sign In
          </button>
        </div>

      </div>
    </div>
  );
};
