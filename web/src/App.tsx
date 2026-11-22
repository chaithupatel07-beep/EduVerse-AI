import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { EmailVerification } from './pages/EmailVerification';
import { AccessDenied } from './pages/AccessDenied';
import { Profile } from './pages/Profile';
import { FoundationDashboard } from './pages/dashboards/FoundationDashboard';
import { StudentDashboard } from './pages/dashboards/StudentDashboard';
import { TeacherDashboard } from './pages/dashboards/TeacherDashboard';
import { ParentDashboard } from './pages/dashboards/ParentDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { NotFound } from './pages/NotFound';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('foundation');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return <LoadingSpinner fullPage label="Initializing EduVerse AI Ecosystem..." />;
  }

  // Guest / Unauthenticated views
  if (!isAuthenticated || !user) {
    if (currentView === 'register') {
      return <Register onNavigate={setCurrentView} />;
    }
    if (currentView === 'forgot-password') {
      return <ForgotPassword onNavigate={setCurrentView} />;
    }
    if (currentView === 'verify-email') {
      return <EmailVerification onNavigate={setCurrentView} />;
    }
    return <Login onNavigate={setCurrentView} />;
  }

  // Role-Specific Dashboard Selector
  const renderDashboardByRole = () => {
    switch (user.role) {
      case 'student':
        return <StudentDashboard currentView={currentView} onNavigate={setCurrentView} />;
      case 'teacher':
        return <TeacherDashboard currentView={currentView} onNavigate={setCurrentView} />;
      case 'parent':
        return <ParentDashboard currentView={currentView} onNavigate={setCurrentView} />;
      case 'admin':
        return <AdminDashboard currentView={currentView} onNavigate={setCurrentView} />;
      default:
        return <FoundationDashboard onNavigate={setCurrentView} />;
    }
  };

  // Main View Router
  const renderView = () => {
    switch (currentView) {
      case 'foundation':
        return <FoundationDashboard onNavigate={setCurrentView} />;
      case 'profile':
        return <Profile />;
      case 'verify-email':
        return <EmailVerification onNavigate={setCurrentView} />;
      case 'access-denied':
        return <AccessDenied onNavigate={setCurrentView} />;

      // Student navigation pages
      case 'courses':
      case 'materials':
      case 'ai-tutor':
      case 'quizzes':
      case 'exam-simulator':
      case 'notes-scanner':
      case 'study-plan':
      case 'gamification':
      case 'knowledge-map':
      // Teacher navigation pages
      case 'classes':
      case 'curriculum':
      case 'assignments':
      case 'ai-generator':
      case 'early-warning':
      // Parent navigation pages
      case 'ai-advisor':
      case 'academics':
      case 'children':
      case 'performance':
      // Cross-role & Admin navigation pages
      case 'meetings':
      case 'communications':
      case 'analytics':
      case 'institutions':
      case 'enrollment':
      case 'users':
      case 'reports':
      case 'rag-system':
      case 'system-health':
      case 'security':
      case 'dashboard':
        return renderDashboardByRole();

      default:
        return <NotFound onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          <ViewErrorBoundary onReset={() => setCurrentView('foundation')}>
            {renderView()}
          </ViewErrorBoundary>
        </main>
      </div>
    </div>
  );
};

class ViewErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EduVerse ViewErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto my-12 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Sparkles size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Workspace View Protected</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            EduVerse AI intercepted a data rendering mismatch. Click below to return to the verified Ecosystem Overview.
          </p>
          {this.state.error && (
            <p className="text-[10px] text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-200 truncate">
              {this.state.error.message}
            </p>
          )}
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
            >
              Return to Ecosystem Overview
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EduVerse ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 border border-slate-700 text-center space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-blue-400">EduVerse AI Ecosystem Active</h2>
            <p className="text-xs text-slate-300">
              The application recovered from an unexpected rendering state. Click below to continue directly to the dashboard.
            </p>
            {this.state.error && (
              <p className="text-[11px] text-rose-300 font-mono bg-slate-950 p-2.5 rounded-xl border border-rose-900/40 text-left truncate">
                {this.state.error.message || String(this.state.error)}
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
              >
                Reload Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
