import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import regnixLogo from '../../assets/regnix.png'; // Imported the image asset

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          {/* Logo container area using the imported PNG image */}
          <div className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <img 
              src={regnixLogo} 
              alt="Regnix Logo" 
              style={{ height: '42px', width: 'auto', display: 'block' }} 
            />
            <span className={styles.logoDot} style={{ margin: '0 2px' }}>·</span>
            <span className={styles.logoSub}>by Lexvon</span>
          </div>
          <p className={styles.tagline}>Unified compliance, audit, legal & HR — purpose-built for Indian enterprises.</p>
          <div className={styles.socialRow}>
            <button className={styles.socialBtn}>LinkedIn</button>
            <button className={styles.socialBtn}>Twitter</button>
          </div>
        </div>
        <div className={styles.cols}>
          <div className={styles.col}>
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#modules">Modules</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><Link to="/signup">Get Started</Link></li>
            </ul>
          </div>
          <div className={styles.col}>
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Data Security</a></li>
              <li><a href="#">DPDP Compliance</a></li>
            </ul>
          </div>
          <div className={styles.col}>
            <h4>Company</h4>
            <ul>
              <li><a href="#about">About Lexvon</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} Lexvon Technologies Pvt. Ltd. All rights reserved.</p>
        <p>Made with ♥ in India 🇮🇳</p>
      </div>
    </footer>
  );
}