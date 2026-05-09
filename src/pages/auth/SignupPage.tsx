import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AccountType, SignupFormData } from '@/types';
import styles from './AuthPage.module.css';

const INDUSTRIES = ['Manufacturing','IT / Software','BFSI','Healthcare','Retail','Logistics','Construction','Education','Hospitality','Other'];

const LogoSVG = () => (
  <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4.5C3 3.67 3.67 3 4.5 3H9C11.48 3 13.5 5.02 13.5 7.5C13.5 9.98 11.48 12 9 12H7.5V15H5.25V12H4.5C3.67 12 3 11.33 3 10.5V4.5Z" fill="white"/>
    <path d="M9 12H10.5L13.5 15H11L9 12Z" fill="rgba(255,255,255,0.6)"/>
  </svg>
);

export default function SignupPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>((params.get('type') as AccountType) || 'company');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', companyName:'', industry:'', gstin:'' });

  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated, navigate]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({...f,[k]:e.target.value}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await signup({ accountType, name:form.name, email:form.email, password:form.password, confirmPassword:form.confirmPassword, companyName:form.companyName, industry:form.industry, gstin:form.gstin } as SignupFormData);
      navigate('/dashboard');
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.leftGrid} aria-hidden />
        <div className={styles.leftBlob} aria-hidden />
        <Link to="/" className={styles.logoLink}>
          <span className={styles.logoMark}><LogoSVG /></span>
          <span className={styles.logoName}>Regnix</span>
          <span className={styles.logoDot}>·</span>
          <span className={styles.logoSub}>by Lexvon</span>
        </Link>
        <div className={styles.leftContent}>
          <p className={styles.leftEyebrow}>Join 200+ Indian enterprises</p>
          <h2 className={styles.leftTitle}>
            India's most intelligent<br />
            <span className={styles.leftTitleItalic}>compliance platform</span>
          </h2>
          <p className={styles.leftSub}>Compliance, audit, legal, payroll, and HR operations — unified in one intelligent workspace.</p>
          <div className={styles.leftPoints}>
            {['AI-powered compliance engine','Legal document analysis & drafting','Audit planning & continuous monitoring','Payroll & statutory filing automation','Vendor & employee lifecycle tracking'].map(p => (
              <div key={p} className={styles.leftPoint}><span className={styles.pointDot} />{p}</div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Create your account</h1>
            <p className={styles.formSub}>Already have an account? <Link to="/login" className={styles.formLink}>Sign in</Link></p>
          </div>

          <div className={styles.typeToggle}>
            <button className={`${styles.typeBtn} ${accountType==='company'?styles.typeActive:''}`} onClick={() => setAccountType('company')} type="button">🏢 Company</button>
            <button className={`${styles.typeBtn} ${accountType==='client'?styles.typeActive:''}`} onClick={() => setAccountType('client')} type="button">👤 Client / Consultant</button>
          </div>
          <p className={styles.typeHint}>{accountType==='company' ? 'For enterprises & organizations managing their own compliance.' : 'For consultants & advisors managing compliance for multiple clients.'}</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input label="Full Name" placeholder="Rahul Sharma" value={form.name} onChange={set('name')} required />
            <Input label="Work Email" type="email" placeholder="rahul@company.com" value={form.email} onChange={set('email')} required />

            {accountType === 'company' && (<>
              <Input label="Company Name" placeholder="Acme Pvt. Ltd." value={form.companyName} onChange={set('companyName')} required />
              <div className={styles.row}>
                <div className={styles.fieldWrap}>
                  <label className={styles.fieldLabel}>Industry</label>
                  <select className={styles.select} value={form.industry} onChange={set('industry')} required>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <Input label="GSTIN (optional)" placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={set('gstin')} />
              </div>
            </>)}

            {accountType === 'client' && (
              <Input label="Firm / Practice Name" placeholder="Your consulting firm" value={form.companyName} onChange={set('companyName')} />
            )}

            <div className={styles.row}>
              <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required />
              <Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}
            <Button type="submit" variant="primary" size="lg" loading={loading}>
              {accountType === 'company' ? 'Create Company Account' : 'Create Client Account'}
            </Button>
            <p className={styles.terms}>By signing up you agree to Lexvon's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
