import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import ComplianceCalendar from '../../components/dashboard/comlianceCalender/ComplianceCalendar';
import DocumentGenerator from '../../components/dashboard/documentGenerator/DocumentGenerator';
import styles from './DashboardPage.module.css';

const MODULES = [
  { icon:'⚖️', title:'Compliance', desc:'Calendar, registers, filing tracker & AI alerts', w:22 },
  { icon:'🔍', title:'Audit', desc:'Planner, checklists, findings & monitoring', w:15 },
  { icon:'🧠', title:'Legal AI', desc:'Notice analyzer, reply drafts & case tracker', w:18 },
  { icon:'💰', title:'Payroll', desc:'PF, ESIC, PT calculations & payslip generator', w:12 },
  { icon:'👥', title:'Workforce', desc:'Employee lifecycle & vendor management', w:10 },
  { icon:'📂', title:'Documents', desc:'Central hub with version control & templates', w:8 },
  { icon:'📊', title:'Reports', desc:'Predictive analytics & exportable reports', w:6 },
  { icon:'✅', title:'Tasks', desc:'Workflow, SLA tracking & escalation matrix', w:5 },
];

function DashboardHome() {
  const { user } = useAuth();
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <div className={styles.welcome}>
        <div className={styles.welcomeInner}>
          <span className={styles.welcomeEmoji}>👋</span>
          <div>
            <h1 className={styles.welcomeTitle}>{greeting}, {user?.name?.split(' ')[0]}</h1>
            <p className={styles.welcomeSub}>Your Regnix workspace is active. Modules are being rolled out progressively.</p>
          </div>
        </div>
        <div className={styles.earlyPill}>
          <span className={styles.earlyDot} />
          Early Access
        </div>
      </div>

      <div className={styles.banner}>
        <div className={styles.bannerIcon}>🚀</div>
        <div className={styles.bannerText}>
          <strong>Platform modules are in active development</strong>
          <p>All 12 Regnix modules are being built and will activate progressively. You'll receive an email as each module goes live.</p>
        </div>
        <div className={styles.progress}>
          <div className={styles.progressLabel}>Build Progress</div>
          <div className={styles.progressTrack}><div className={styles.progressFill} style={{width:'18%'}} /></div>
          <div className={styles.progressPct}>18% complete</div>
        </div>
      </div>

      <div className={styles.sectionRow}>
        <span className={styles.sectionTitle}>Modules</span>
        <span className={styles.sectionPill}>Coming Soon</span>
      </div>

      <div className={styles.moduleGrid}>
        {MODULES.map(m => (
          <div className={styles.moduleCard} key={m.title}>
            <div className={styles.moduleCardTop}>
              <span className={styles.moduleIcon}>{m.icon}</span>
              <span className={styles.moduleStatus}>Soon</span>
            </div>
            <div className={styles.moduleTitle}>{m.title}</div>
            <div className={styles.moduleDesc}>{m.desc}</div>
            <div className={styles.moduleBar}><div className={styles.moduleBarFill} style={{width:`${m.w}%`}} /></div>
          </div>
        ))}
      </div>

      <div className={styles.accountCard}>
        <div className={styles.accountTitle}>Account Details</div>
        <div className={styles.accountGrid}>
          <div className={styles.accountField}>
            <span className={styles.fieldKey}>Name</span>
            <span className={styles.fieldVal}>{user?.name}</span>
          </div>
          <div className={styles.accountField}>
            <span className={styles.fieldKey}>Email</span>
            <span className={styles.fieldVal}>{user?.email}</span>
          </div>
          <div className={styles.accountField}>
            <span className={styles.fieldKey}>Account Type</span>
            <span className={styles.fieldVal} style={{textTransform:'capitalize'}}>{user?.accountType}</span>
          </div>
          {user?.companyName && (
            <div className={styles.accountField}>
              <span className={styles.fieldKey}>Company</span>
              <span className={styles.fieldVal}>{user.companyName}</span>
            </div>
          )}
          <div className={styles.accountField}>
            <span className={styles.fieldKey}>Member Since</span>
            <span className={styles.fieldVal}>{new Date(user?.createdAt ?? '').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>
          </div>
          <div className={styles.accountField}>
            <span className={styles.fieldKey}>Plan</span>
            <span className={styles.fieldVal}><span className={styles.planPill}>Early Access — Free</span></span>
          </div>
        </div>
      </div>
    </>
  );
}

// Map view IDs to their rendered components
function renderView(view: string) {
  switch (view) {
    case 'calendar':   return <ComplianceCalendar />;
    case 'generator':  return <DocumentGenerator />;
    // case 'checker':    return <ApplicabilityChecker />;
    // case 'register':   return <StatutoryRegister />;
    // case 'filing':     return <FilingTracker />;
    default:           return <DashboardHome />;
  }
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('generator');

  useEffect(() => { if (!isAuthenticated) navigate('/login'); }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;

  return (
    <div className={styles.layout}>
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        activeView={activeView}
        onNavigate={setActiveView}
      />
      <div className={styles.main}>
        <DashboardHeader />
        <div className={styles.content}>
          {renderView(activeView)}
        </div>
      </div>
    </div>
  );
}
