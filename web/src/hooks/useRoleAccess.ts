import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const useRoleAccess = () => {
  const { user, isStudent, isTeacher, isParent, isAdmin } = useAuth();

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return {
    user,
    currentRole: user?.role,
    isStudent,
    isTeacher,
    isParent,
    isAdmin,
    hasRole,
  };
};
