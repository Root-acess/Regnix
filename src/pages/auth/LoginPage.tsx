import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './AuthPage.module.css';

const LogoSVG = () => (
  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 4.5C3 3.67 3.67 3 4.5 3H9C11.48 3 13.5 5.02 13.5 7.5C13.5 9.98 11.48 12 9 12H7.5V15H5.25V12H4.5C3.67 12 3 11.33 3 10.5V4.5Z"
      fill="white"
    />
    <path d="M9 12H10.5L13.5 15H11L9 12Z" fill="rgba(255,255,255,0.6)" />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.leftGrid} aria-hidden />
        <div className={styles.leftBlob} aria-hidden />

        <Link to="/" className={styles.logoLink}>
          <span className={styles.logoMark}>
            <LogoSVG />
          </span>
          <span className={styles.logoName}>Regnix</span>
          <span className={styles.logoDot}>·</span>
          <span className={styles.logoSub}>by Lexvon</span>
        </Link>

        <div className={styles.leftContent}>
          <p className={styles.leftEyebrow}>Welcome back</p>
          <h2 className={styles.leftTitle}>
            Your compliance command<br />
            <span className={styles.leftTitleItalic}>centre awaits</span>
          </h2>
          <p className={styles.leftSub}>
            Sign in to continue managing your compliance, audit, legal, and HR
            operations in one unified workspace.
          </p>

          <div className={styles.leftPoints}>
            {[
              'Real-time compliance score',
              'Open audit & legal notices',
              'Pending deadlines & tasks',
              'AI-powered recommendations',
              'Team workflow updates',
            ].map((p) => (
              <div key={p} className={styles.leftPoint}>
                <span className={styles.pointDot} />
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Sign in to Regnix</h1>
            <p className={styles.formSub}>
              No account yet?{' '}
              <Link to="/signup" className={styles.formLink}>
                Create one free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email / Username"
              type="text"
              placeholder="admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="123456"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className={styles.forgotRow}>
              <a href="#" className={styles.forgot}>
                Forgot password?
              </a>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <Button type="submit" variant="primary" size="lg" loading={loading}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}