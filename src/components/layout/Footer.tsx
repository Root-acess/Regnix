import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
const LogoSVG = () => (<svg viewBox="0 0 16 16" fill="none"><path d="M2 4C2 3.45 2.45 3 3 3H8C10.2 3 12 4.8 12 7C12 9.2 10.2 11 8 11H6.5V13H4.5V11H3C2.45 11 2 10.55 2 10V4Z" fill="white"/><path d="M8 11H9.5L12 13H10L8 11Z" fill="rgba(255,255,255,0.5)"/></svg>);
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <div className={styles.logo}>
            <span className={styles.logoMark}><LogoSVG /></span>
            <span className={styles.logoName}>Regnix</span>
            <span className={styles.logoDot}>·</span>
            <span className={styles.logoSub}>by Lexvon</span>
          </div>
          <p className={styles.tagline}>Unified compliance, audit, legal & HR — purpose-built for Indian enterprises.</p>
          <div className={styles.socialRow}>
            <button className={styles.socialBtn}>LinkedIn</button>
            <button className={styles.socialBtn}>Twitter</button>
          </div>
        </div>
        <div className={styles.cols}>
          <div className={styles.col}><h4>Product</h4><ul><li><a href="#features">Features</a></li><li><a href="#modules">Modules</a></li><li><a href="#pricing">Pricing</a></li><li><Link to="/signup">Get Started</Link></li></ul></div>
          <div className={styles.col}><h4>Legal</h4><ul><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Service</a></li><li><a href="#">Data Security</a></li><li><a href="#">DPDP Compliance</a></li></ul></div>
          <div className={styles.col}><h4>Company</h4><ul><li><a href="#about">About Lexvon</a></li><li><a href="#">Careers</a></li><li><a href="#">Contact</a></li><li><a href="#">Blog</a></li></ul></div>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} Lexvon Technologies Pvt. Ltd. All rights reserved.</p>
        <p>Made with ♥ in India 🇮🇳</p>
      </div>
    </footer>
  );
}
