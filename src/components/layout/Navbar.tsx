import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import styles from './Navbar.module.css';
import regnixLogo from '../../assets/regnix.png';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        {/* Cleaned up and polished brand container */}
        <Link 
          to="/" 
          className={styles.logo} 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '10px', 
            textDecoration: 'none',
            lineHeight: 1
          }}
        >
          <img 
            src={regnixLogo} 
            alt="Regnix Logo" 
            style={{ 
              height: '40px', 
              width: 'auto', 
              display: 'block',
              imageRendering: 'auto'
            }} 
          />
          {/* Replaced generic dot with an elegant, crisp vertical divider */}
          <span 
            style={{ 
              color: 'rgba(0, 0, 0, 0.15)', 
              fontSize: '14px',
              fontWeight: 300,
              userSelect: 'none'
            }}
          >
            |
          </span>
          <span 
            style={{ 
              fontSize: '14px', 
              color: '#64748b', // Slate-500 for a perfectly balanced corporate hierarchy
              fontWeight: 500,
              letterSpacing: '-0.01em',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            by Lexvon
          </span>
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