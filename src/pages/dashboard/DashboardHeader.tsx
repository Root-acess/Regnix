import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './DashboardHeader.module.css';

export function DashboardHeader() {
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
        <button className={styles.iconBtn} title="Notifications">
          🔔<span className={styles.notifDot} />
        </button>
        <div className={styles.userMenu}>
          <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.name}</p>
            <p className={styles.userRole}>{user?.accountType === 'company' ? 'Company Admin' : 'Client'}</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">↩</button>
        </div>
      </div>
    </header>
  );
}
