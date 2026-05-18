import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import styles from './Hero.module.css';
import regnixLogo from '../../assets/regnix.png';

const BAR_H = [35,52,44,68,58,80,72,88,76,92,84,96];
const BAR_C = ['#7C3AED','#A78BFA','#7C3AED','#A78BFA','#7C3AED','#A78BFA','#7C3AED','#A78BFA','#7C3AED','#7C3AED','#A78BFA','#7C3AED'];

const TASKS = [
  { label:'PF Filing — June 2025', badge:'Due in 3d', bc:'rgba(217,119,6,0.12)', bcc:'#D97706', dc:'#D97706' },
  { label:'Vendor compliance audit', badge:'In Progress', bc:'rgba(124,58,237,0.1)', bcc:'#7C3AED', dc:'#7C3AED' },
  { label:'Labour law amendment review', badge:'Pending', bc:'rgba(107,114,128,0.1)', bcc:'#6B7280', dc:'#6B7280' },
];

const KPI = [
  { label:'Compliance Score', val:'94%', sub:'+2% this month', badge:'Excellent', bc:'rgba(5,150,105,0.1)', bcc:'#059669', vc:'#059669' },
  { label:'Open Audits', val:'3', sub:'1 critical', badge:'Active', bc:'rgba(124,58,237,0.1)', bcc:'#7C3AED', vc:'var(--c-text)' },
  { label:'Legal Notices', val:'1', sub:'Reply due soon', badge:'Urgent', bc:'rgba(220,38,38,0.1)', bcc:'#DC2626', vc:'#DC2626' },
  { label:'Filings This Month', val:'7/9', sub:'2 pending', badge:'On Track', bc:'rgba(5,150,105,0.1)', bcc:'#059669', vc:'var(--c-text)' },
];

export function Hero() {
  const navigate = useNavigate();
  return (
    <div className={styles.heroWrap}>
      <div className={styles.circle1} aria-hidden />
      <div className={styles.circle2} aria-hidden />
      <div className={styles.dotGrid} aria-hidden />

      <div className={styles.hero}>
        {/* Pill */}
        <div className={styles.pill}>
          <span className={styles.pillBadge}>New</span>
          <span className={styles.pillDot} />
          AI-powered Legal Document Analysis is now live
        </div>

        {/* Headline */}
        <h1 className={styles.heading}>
          Compliance, Audit &amp; Legal —{' '}
          <span className={styles.headingItalic}>unified</span>{' '}
          <span className={styles.headingPurple}>for India</span>
        </h1>

        <p className={styles.sub}>
          Regnix replaces your compliance spreadsheets, email chains, and disconnected tools with one intelligent platform — built for Indian enterprises.
        </p>

        {/* CTAs */}
        <div className={styles.ctas}>
          <Button size="lg" variant="primary" onClick={() => navigate('/signup?type=company')}>
            Start as a Company — Free
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/signup?type=client')}>
            Start as a Client
          </Button>
        </div>

        {/* Trust */}
        <div className={styles.trust}>
          {[
            'No credit card required',
            'Free during Early Access',
            'ISO 27001 Aligned',
            'India Labour Law Expert',
            'DPDP Compliant',
          ].map((item, i, arr) => (
            <>
              <div key={item} className={styles.trustItem}>
                <span className={styles.trustCheck}>✓</span>
                {item}
              </div>
              {i < arr.length - 1 && <div key={`d${i}`} className={styles.trustDivider} />}
            </>
          ))}
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {[
            { n:'12+', l:'Compliance Modules' },
            { n:'200+', l:'Companies Onboarded' },
            { n:'50+', l:'Laws Covered' },
            { n:'AI', l:'Legal Engine' },
          ].map(s => (
            <div className={styles.stat} key={s.l}>
              <span className={styles.statNum}>{s.n}</span>
              <span className={styles.statLabel}>{s.l}</span>
            </div>
          ))}
        </div>

        {/* Dashboard mockup */}
        <div className={styles.mockupWrap}>
          <div className={styles.mockupShell}>
            <div className={styles.mockupBar}>
              <span className={styles.dot}/><span className={styles.dot}/><span className={styles.dot}/>
              <div className={styles.mockupLogoWrap}>
                <img src={regnixLogo} alt="Regnix" className={styles.mockupLogo} />
              </div>
              <div className={styles.urlBar}>
                <span className={styles.urlLock}>🔒</span>
                app.regnix.in/dashboard
              </div>
            </div>
            <div className={styles.mockupBody}>
              {/* Sidebar */}
              <div className={styles.mockupSide}>
                <div className={styles.sideSection}>Main</div>
                {[
                  {icon:'▦', label:'Dashboard', active:true},
                  {icon:'⚖', label:'Compliance'},
                  {icon:'◎', label:'Audit'},
                  {icon:'🧠', label:'Legal AI'},
                ].map(m => (
                  <div key={m.label} className={`${styles.sideItem} ${m.active?styles.sideItemActive:''}`}>
                    <span className={styles.sideIcon}>{m.icon}</span>{m.label}
                  </div>
                ))}
                <div className={styles.sideSection}>Operations</div>
                {[
                  {icon:'💰', label:'Payroll'},
                  {icon:'👥', label:'Workforce'},
                  {icon:'📂', label:'Documents'},
                  {icon:'📊', label:'Reports'},
                ].map(m => (
                  <div key={m.label} className={`${styles.sideItem}`}>
                    <span className={styles.sideIcon}>{m.icon}</span>{m.label}
                  </div>
                ))}
              </div>

              {/* Main area */}
              <div className={styles.mockupMain}>
                {/* KPI row */}
                <div className={styles.kpiRow}>
                  {KPI.map(k => (
                    <div className={styles.kpiCard} key={k.label}>
                      <div className={styles.kpiTop}>
                        <span className={styles.kpiLabel}>{k.label}</span>
                        <span className={styles.kpiBadge} style={{background:k.bc,color:k.bcc}}>{k.badge}</span>
                      </div>
                      <span className={styles.kpiVal} style={{color:k.vc}}>{k.val}</span>
                      <span className={styles.kpiSub}>{k.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Mid row */}
                <div className={styles.midRow}>
                  <div className={styles.chartCard}>
                    <div className={styles.chartHead}>
                      <span className={styles.chartTitle}>Compliance Trend — Last 12 Months</span>
                      <span className={styles.chartBadge}>↑ 18% YoY</span>
                    </div>
                    <div className={styles.bars}>
                      {BAR_H.map((h,i) => (
                        <div key={i} className={styles.bar} style={{height:`${h}%`, background:BAR_C[i], opacity:0.85}} />
                      ))}
                    </div>
                  </div>

                  <div className={styles.taskCard}>
                    <div className={styles.taskTitle}>Pending Actions</div>
                    {TASKS.map(t => (
                      <div key={t.label} className={styles.taskItem}>
                        <span className={styles.taskDot} style={{background:t.dc}} />
                        <span className={styles.taskText}>{t.label}</span>
                        <span className={styles.taskBadge} style={{background:t.bc,color:t.bcc}}>{t.badge}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
