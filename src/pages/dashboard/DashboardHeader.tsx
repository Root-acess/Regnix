import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './DashboardHeader.module.css';

interface Props {
  onAiToggle: () => void;
  aiOpen: boolean;
}

export function DashboardHeader({ onAiToggle, aiOpen }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className={styles.header}>
      <div className={styles.breadcrumb}>
        <span className={styles.breadRoot}>Regnix</span>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>Dashboard</span>
      </div>
      <div className={styles.right}>
        <div className={styles.search}>
          <span className={styles.searchIcon}>⌕</span>
          <input className={styles.searchInput} placeholder="Search modules, tasks…" />
          <kbd className={styles.kbd}>⌘K</kbd>
        </div>
        <button
          className={`${styles.aiToggleBtn} ${aiOpen ? styles.aiToggleActive : ''}`}
          onClick={onAiToggle}
          title="AI Compliance Assistant"
        >
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{flexShrink:0}}>
            <path d="M2 3.5C2 2.95 2.45 2.5 3 2.5H7.5C9.43 2.5 11 4.07 11 6C11 7.93 9.43 9.5 7.5 9.5H6.25V12H4.5V9.5H3C2.45 9.5 2 9.05 2 8.5V3.5Z" fill="currentColor"/>
            <path d="M7.5 9.5H8.75L11 12H9.25L7.5 9.5Z" fill="currentColor" opacity="0.55"/>
          </svg>
          AI Compliance Assistant
        </button>
        <button className={styles.iconBtn} title="Calendar">📅</button>
        <button className={styles.iconBtn} title="Notifications">
          🔔<span className={styles.notifDot} />
        </button>
        <div className={styles.userMenu}>
          <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.name}</p>
            <p className={styles.userRole}>{user?.accountType === 'company' ? 'VP Compliance' : 'Client'}</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">↩</button>
        </div>
      </div>
    </header>
  );
}
