import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User, AccountType, SignupFormData } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, _password: string) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('regnix_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, _password: string) => {
    // TODO: replace with real API call
    await new Promise(r => setTimeout(r, 800));
    const mockUser: User = {
      id: crypto.randomUUID(),
      email,
      name: email.split('@')[0],
      accountType: 'company',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('regnix_user', JSON.stringify(mockUser));
    setUser(mockUser);
  }, []);

  const signup = useCallback(async (data: SignupFormData) => {
    // TODO: replace with real API call
    await new Promise(r => setTimeout(r, 1000));
    const newUser: User = {
      id: crypto.randomUUID(),
      email: data.email,
      name: data.name,
      accountType: data.accountType as AccountType,
      companyName: data.companyName,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('regnix_user', JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('regnix_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
