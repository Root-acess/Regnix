import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import styles from './Navbar.module.css';

const LogoSVG = () => (
  <svg viewBox="0 0 18 18" fill="none">
    <path d="M3 4.5C3 3.67 3.67 3 4.5 3H9C11.48 3 13.5 5.02 13.5 7.5C13.5 9.98 11.48 12 9 12H7.5V15H5.25V12H4.5C3.67 12 3 11.33 3 10.5V4.5Z" fill="white"/>
    <path d="M9 12H10.5L13.5 15H11L9 12Z" fill="rgba(255,255,255,0.65)"/>
  </svg>
);

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}><LogoSVG /></span>
          <span className={styles.logoName}>Regnix</span>
          <span className={styles.logoDot}>·</span>
          <span className={styles.logoSub}>by Lexvon</span>
        </Link>
        <ul className={styles.links}>
          <li><a href="#features" className={styles.link}>Features</a></li>
          <li><a href="#modules" className={styles.link}>Modules</a></li>
          <li><a href="#about" className={styles.link}>About</a></li>
          <li><a href="#pricing" className={styles.link}>Pricing</a></li>
        </ul>
        <div className={styles.actions}>
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>{user?.name}</Button>
              <Button variant="secondary" size="sm" onClick={handleLogout}>Sign Out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>Get started free</Button>
            </>
          )}
        </div>
        <button className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </nav>
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {['#features','#modules','#about','#pricing'].map((href, i) => (
            <a key={href} href={href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {['Features','Modules','About','Pricing'][i]}
            </a>
          ))}
          <div className={styles.mobileCtas}>
            <Button variant="secondary" size="md" onClick={() => { navigate('/login'); setMenuOpen(false); }}>Sign in</Button>
            <Button variant="primary" size="md" onClick={() => { navigate('/signup'); setMenuOpen(false); }}>Get started free</Button>
          </div>
        </div>
      )}
    </header>
  );
}
