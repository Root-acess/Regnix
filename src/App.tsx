import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import LandingPage from '@/pages/landing/LandingPage';
import SignupPage from '@/pages/auth/SignupPage';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Dashboard with nested routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/:section" element={<DashboardPage />} />
          <Route path="/dashboard/:section/:sub" element={<DashboardPage />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
