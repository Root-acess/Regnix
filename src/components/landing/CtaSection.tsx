import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import styles from './CtaSection.module.css';
import regnixLogo from '../../assets/regnix.png';

const LOGOS = ['Tata Group','Infosys','HDFC Bank','Wipro','Bajaj Finance','Mahindra','Reliance','Adani Ports'];

export function CtaSection() {
  const navigate = useNavigate();
  return (
    <>
      {/* Logo strip — V-Comply style social proof */}
      <div className={styles.logoStrip}>
        <div className={styles.logoStripInner}>
          <p className={styles.logoStripLabel}>Trusted by compliance teams at leading Indian enterprises</p>
          <div className={styles.logos}>
            {LOGOS.map(l => <span key={l} className={styles.logoItem}>{l}</span>)}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <section className={styles.section} id="pricing">
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <span className={styles.label}>Get Started</span>
            <h2 className={styles.sectionTitle}>Choose how you want to use Regnix</h2>
            <p className={styles.sectionSub}>Free during Early Access. No credit card required. Full platform access from day one.</p>
          </div>

          <div className={styles.cards}>
            {/* Company */}
            <div className={`${styles.card} ${styles.featuredCard}`}>
              <div className={styles.topAccent} />
              <span className={styles.popularBadge}>Most Popular</span>
              <div className={styles.cardIconWrap}>🏢</div>
              <h3 className={styles.cardTitle}>Company Account</h3>
              <p className={styles.cardDesc}>For enterprises, startups, and organizations managing their own compliance, legal, audit, and HR operations end-to-end.</p>
              <ul className={styles.features}>
                {['Full access to all 12 modules','AI-powered compliance & legal engine','Multi-user roles — HR, Admin, CXO','Vendor & employee lifecycle tracking','Audit planner & continuous monitoring','Payroll & statutory filing automation'].map(f => (
                  <li key={f}><span className={styles.check}>✓</span>{f}</li>
                ))}
              </ul>
              <Button variant="primary" size="lg" onClick={() => navigate('/signup?type=company')}>
                Get started as Company →
              </Button>
            </div>

            {/* Client */}
            <div className={styles.card}>
              <div className={styles.cardIconWrap}>👤</div>
              <h3 className={styles.cardTitle}>Client Account</h3>
              <p className={styles.cardDesc}>For consultants, advisors, and CA/CS firms who manage compliance operations on behalf of multiple client organizations.</p>
              <ul className={styles.features}>
                {['Manage multiple company profiles','Centralized compliance dashboard','Audit & legal collaboration tools','Client-facing document sharing','White-label report generation','Dedicated support channel'].map(f => (
                  <li key={f}><span className={styles.check}>✓</span>{f}</li>
                ))}
              </ul>
              <Button variant="outline" size="lg" onClick={() => navigate('/signup?type=client')}>
                Get started as Client →
              </Button>
            </div>
          </div>

          {/* Bottom banner */}
          <div className={styles.banner}>
            <div className={styles.bannerLogoWrap}>
              <img src={regnixLogo} alt="Regnix" className={styles.bannerLogo} />
            </div>
            <div className={styles.bannerText}>
              <h3>Ready to simplify compliance?</h3>
              <p>Join 200+ Indian enterprises already on Regnix. Free during Early Access.</p>
            </div>
            <div className={styles.bannerActions}>
              <button className={styles.bannerBtnPrimary} onClick={() => navigate('/signup?type=company')}>
                Sign up as Company
              </button>
              <button className={styles.bannerBtnSecondary} onClick={() => navigate('/signup?type=client')}>
                Sign up as Client
              </button>
            </div>
          </div>

          <p className={styles.footnote}>ISO 27001 Aligned · DPDP Compliant · MCA Aligned · No lock-in contracts</p>
        </div>
      </section>
    </>
  );
}
