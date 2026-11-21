import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { UserProfile, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  quickSwitchRole: (role: UserRole) => Promise<void>;
  clearError: () => void;
  isStudent: boolean;
  isTeacher: boolean;
  isParent: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; title: string; subtitle: string }> = {
  student: {
    email: 'student@eduverse.io',
    pass: 'Password123!',
    title: 'Alex Chen',
    subtitle: 'Grade 11 STEM Student',
  },
  teacher: {
    email: 'teacher@eduverse.io',
    pass: 'Password123!',
    title: 'Dr. Sarah Jenkins',
    subtitle: 'Physics & AI Faculty',
  },
  parent: {
    email: 'parent@eduverse.io',
    pass: 'Password123!',
    title: 'Marcus Chen',
    subtitle: 'Parent of Alex Chen',
  },
  admin: {
    email: 'admin@eduverse.io',
    pass: 'Password123!',
    title: 'Dean Eleanor Vance',
    subtitle: 'Institution Administrator',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('eduverse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('eduverse_access_token');
      if (token) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          localStorage.setItem('eduverse_user', JSON.stringify(profile));
        } catch {
          // Token expired or invalid
          setUser(null);
          localStorage.removeItem('eduverse_access_token');
          localStorage.removeItem('eduverse_refresh_token');
          localStorage.removeItem('eduverse_user');
        }
      }
      setIsLoading(false);
    };

    const handleAuthReset = () => {
      setUser(null);
      setError('Session expired. Please log in again.');
    };

    window.addEventListener('eduverse_auth_reset', handleAuthReset);
    initAuth();

    return () => {
      window.removeEventListener('eduverse_auth_reset', handleAuthReset);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login(email, password);
      localStorage.setItem('eduverse_access_token', res.tokens.access_token);
      localStorage.setItem('eduverse_refresh_token', res.tokens.refresh_token);
      localStorage.setItem('eduverse_user', JSON.stringify(res.user));
      setUser(res.user);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Login failed. Please verify credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.register(data);
      localStorage.setItem('eduverse_access_token', res.tokens.access_token);
      localStorage.setItem('eduverse_refresh_token', res.tokens.refresh_token);
      localStorage.setItem('eduverse_user', JSON.stringify(res.user));
      setUser(res.user);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const quickSwitchRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      const updated = await authService.updateProfile(updates);
      setUser(updated);
      localStorage.setItem('eduverse_user', JSON.stringify(updated));
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const roleFlags = useMemo(() => ({
    isStudent: user?.role === 'student',
    isTeacher: user?.role === 'teacher',
    isParent: user?.role === 'parent',
    isAdmin: user?.role === 'admin',
  }), [user?.role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        quickSwitchRole,
        clearError,
        ...roleFlags,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
