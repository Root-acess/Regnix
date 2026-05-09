// ─── User & Auth Types ────────────────────────────────────────────
export type AccountType = 'company' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  accountType: AccountType;
  companyName?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// ─── Form Types ───────────────────────────────────────────────────
export interface SignupFormData {
  accountType: AccountType;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName?: string;
  industry?: string;
  gstin?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// ─── Nav Types ────────────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
}
