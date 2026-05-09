import { useState } from 'react';
import styles from './Features.module.css';

const ALL_MODULES = [
  { n:'01', icon:'⚖️', title:'Compliance Engine', desc:'Applicability checker, statutory register, compliance calendar, auto-alerts, and AI-powered filing tracker.', tag:'Core', tc:'rgba(124,58,237,0.1)', tcc:'#7C3AED', cat:'Compliance' },
  { n:'02', icon:'🔍', title:'Audit Management', desc:'Industry-wise planner, checklists, evidence upload, findings log, continuous monitoring, and risk scoring.', tag:'Core', tc:'rgba(124,58,237,0.1)', tcc:'#7C3AED', cat:'Compliance' },
  { n:'03', icon:'🧠', title:'Legal AI', desc:'Upload notices and summons. Get instant document analysis, required doc lists, and auto-drafted replies.', tag:'Flagship', tc:'rgba(5,150,105,0.1)', tcc:'#059669', cat:'Legal' },
  { n:'04', icon:'⚡', title:'Amendment Tracker', desc:'Get real-time alerts when labour laws, GST rules, or MCA regulations change. Never miss an update.', tag:'AI', tc:'rgba(217,119,6,0.1)', tcc:'#D97706', cat:'Compliance' },
  { n:'05', icon:'💰', title:'Payroll & Statutory', desc:'PF, ESIC, PT auto-calculation. Payslip generator, bank integration, error detection, and compliance validation.', tag:'Core', tc:'rgba(124,58,237,0.1)', tcc:'#7C3AED', cat:'HR & Payroll' },
  { n:'06', icon:'🏢', title:'Vendor Management', desc:'Onboard vendors, collect compliance documents, auto-generate scorecards, and track risk ratings.', tag:'Core', tc:'rgba(124,58,237,0.1)', tcc:'#7C3AED', cat:'Operations' },
  { n:'07', icon:'👥', title:'Employee Lifecycle', desc:'Onboarding to offboarding — background checks, attendance, timesheets, leaves, and FTE conversion.', tag:'Core', tc:'rgba(124,58,237,0.1)', tcc:'#7C3AED', cat:'HR & Payroll' },
  { n:'08', icon:'📂', title:'Document Hub', desc:'Central repository with expiry alerts, version control, templates library, and auto document generation.', tag:'Core', tc:'rgba(124,58,237,0.1)', tcc:'#7C3AED', cat:'Operations' },
  { n:'09', icon:'📊', title:'Analytics & Reports', desc:'Predictive analytics, risk forecasts, and one-click exports in Excel, PDF, and PowerPoint formats.', tag:'Advanced', tc:'rgba(217,119,6,0.1)', tcc:'#D97706', cat:'Insights' },
];

const TABS = ['All','Compliance','Legal','HR & Payroll','Operations','Insights'];

export function Features() {
  const [active, setActive] = useState('All');
  const filtered = active === 'All' ? ALL_MODULES : ALL_MODULES.filter(m => m.cat === active);

  return (
    <section className={styles.section} id="features">
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.label}>Platform Modules</span>
          <h2 className={styles.title}>
            Everything your team needs,<br />
            <span className={styles.titleItalic}>nothing they don't</span>
          </h2>
          <p className={styles.sub}>
            Stop context-switching between tools. Regnix consolidates compliance, audit, legal, payroll, and HR into one structured platform built for India.
          </p>
        </div>

        <div className={styles.tabs} id="modules">
          {TABS.map(t => (
            <button key={t} className={`${styles.tab} ${active===t?styles.tabActive:''}`} onClick={() => setActive(t)}>{t}</button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtered.map(m => (
            <div className={styles.card} key={m.n}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBox}>{m.icon}</div>
                <span className={styles.cardTag} style={{background:m.tc,color:m.tcc}}>{m.tag}</span>
              </div>
              <span className={styles.cardNum}>{m.n}</span>
              <h3 className={styles.cardTitle}>{m.title}</h3>
              <p className={styles.cardDesc}>{m.desc}</p>
              <span className={styles.cardArrow}>Learn more →</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
