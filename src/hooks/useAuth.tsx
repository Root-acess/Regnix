import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AccountType = 'company' | 'client';

export interface AuthUser {
  name: string;
  email: string;
  accountType?: AccountType;
  companyName?: string;
  industry?: string;
  gstin?: string;
  createdAt?: string;
}

interface SignupFormData {
  accountType: AccountType;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName?: string;
  industry?: string;
  gstin?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => void;
}

const AUTH_KEY = 'regnix_auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.user ?? null;
  } catch {
    return null;
  }
}

function saveStoredAuth(user: AuthUser) {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      user,
      token: 'test-token',
    })
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredAuth());

  useEffect(() => {
    const onStorage = () => {
      setUser(readStoredAuth());
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === 'admin' && password === '123456') {
      const testUser: AuthUser = {
        name: 'Admin',
        email: 'admin',
        accountType: 'company',
        createdAt: new Date().toISOString(),
      };

      saveStoredAuth(testUser);
      setUser(testUser);
      return;
    }

    throw new Error('Invalid credentials');
  };

  const signup = async (data: SignupFormData) => {
    const newUser: AuthUser = {
      name: data.name,
      email: data.email,
      accountType: data.accountType,
      companyName: data.companyName?.trim() || undefined,
      industry: data.industry?.trim() || undefined,
      gstin: data.gstin?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    saveStoredAuth(newUser);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}