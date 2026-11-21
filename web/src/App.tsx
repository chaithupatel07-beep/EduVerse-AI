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
        return <StudentDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'parent':
        return <ParentDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <FoundationDashboard onNavigate={setCurrentView} />;
    }
  };

  // Main View Router
  const renderView = () => {
    switch (currentView) {
      case 'foundation':
        return <FoundationDashboard onNavigate={setCurrentView} />;
      case 'dashboard':
        return renderDashboardByRole();
      case 'profile':
        return <Profile />;
      case 'verify-email':
        return <EmailVerification onNavigate={setCurrentView} />;
      case 'access-denied':
        return <AccessDenied onNavigate={setCurrentView} />;
      case 'courses':
      case 'ai-tutor':
      case 'quizzes':
      case 'study-plan':
        return (
          <ProtectedRoute allowedRoles={['student', 'admin']} onNavigate={setCurrentView}>
            {renderDashboardByRole()}
          </ProtectedRoute>
        );
      case 'classes':
      case 'curriculum':
      case 'ai-generator':
      case 'analytics':
        return (
          <ProtectedRoute allowedRoles={['teacher', 'admin']} onNavigate={setCurrentView}>
            {renderDashboardByRole()}
          </ProtectedRoute>
        );
      case 'children':
      case 'academics':
      case 'communications':
        return (
          <ProtectedRoute allowedRoles={['parent', 'admin']} onNavigate={setCurrentView}>
            {renderDashboardByRole()}
          </ProtectedRoute>
        );
      case 'institutions':
      case 'users':
      case 'system-health':
      case 'security':
        return (
          <ProtectedRoute allowedRoles={['admin']} onNavigate={setCurrentView}>
            <AdminDashboard />
          </ProtectedRoute>
        );
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
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
