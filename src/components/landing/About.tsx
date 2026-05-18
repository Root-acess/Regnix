import styles from './About.module.css';
import regnixLogo from '../../assets/regnix.png';

export function About() {
  return (
    <section className={styles.section} id="about">
      <div className={styles.inner}>
        <div>
          <span className={styles.label}>About Lexvon</span>
          <h2 className={styles.title}>
            Built by people who lived<br />
            <span className={styles.titleItalic}>the compliance problem</span>
          </h2>
          <p className={styles.body}>
            Lexvon Technologies was founded by HR professionals, legal practitioners, and software engineers who watched Indian enterprises lose time and money to fragmented compliance operations.
          </p>
          <p className={styles.body}>
            Regnix is the platform we wished existed — bringing intelligence, structure, and clarity to the daily chaos of compliance, audit, and legal work.
          </p>
          <div className={styles.pillars}>
            {[
              { icon:'🔒', title:'Enterprise-Grade Security', desc:'SOC2-ready infrastructure. All data encrypted at rest and in transit. DPDP compliant.' },
              { icon:'🇮🇳', title:'India-First Platform', desc:'Built for Indian labour law, GST, PF, ESIC, PT, MCA compliance and more.' },
              { icon:'🤖', title:'AI-Augmented Workflows', desc:'Not just automation — intelligent guidance at every step. AI that explains, not just alerts.' },
            ].map(p => (
              <div className={styles.pillar} key={p.title}>
                <div className={styles.pillarIcon}>{p.icon}</div>
                <div>
                  <strong>{p.title}</strong>
                  <p>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.quoteCard}>
            <div className={styles.quoteBar}>
              <span className={styles.quoteBarDot} />
              <span className={styles.quoteLabel}>Founding Story</span>
              <span className={styles.quoteBarLine} />
            </div>
            <p className={styles.quoteText}>
              "We built Regnix because compliance shouldn't be a guessing game. It should be a system — one that tells you exactly what to do, when, and why."
            </p>
            <div className={styles.quoteAuthor}>
              <div className={styles.quoteAvatar}>
                <img src={regnixLogo} alt="Regnix" className={styles.quoteAvatarLogo} />
              </div>
              <div>
                <span className={styles.quoteAuthorName}>Lexvon Founding Team</span>
                <span className={styles.quoteAuthorRole}>Lexvon Technologies · India</span>
              </div>
            </div>
          </div>

          <div className={styles.trustGrid}>
            {['GDPR Ready','ISO 27001','DPDP Compliant','MCA Aligned','PF & ESIC Expert','Labour Law Certified','SOC2 Ready','FSSAI Aligned'].map(t => (
              <div className={styles.trustBadge} key={t}>
                <span className={styles.trustCheck}>✓</span>{t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
