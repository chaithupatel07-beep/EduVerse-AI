import { useState } from 'react';
import { UserProfile } from '../src/types';

export const useMobileAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);

  return {
    user,
    setUser,
    isAuthenticated: !!user,
  };
};
