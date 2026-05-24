import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './DashboardSidebar.module.css';

const LogoSVG = () => (
  <svg viewBox="0 0 15 15" fill="none"><path d="M2 3.5C2 2.95 2.45 2.5 3 2.5H7.5C9.43 2.5 11 4.07 11 6C11 7.93 9.43 9.5 7.5 9.5H6.25V12H4.5V9.5H3C2.45 9.5 2 9.05 2 8.5V3.5Z" fill="white"/><path d="M7.5 9.5H8.75L11 12H9.25L7.5 9.5Z" fill="rgba(255,255,255,0.55)"/></svg>
);

interface NavSection { label: string; items: NavItem[]; }
interface NavItem { id: string; icon: JSX.Element | string; label: string; badge?: string; children?: { id: string; label: string }[]; }

const Icon = ({ d }: { d: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV: NavSection[] = [
  { label: '', items: [
    { id: 'dashboard', icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />, label: 'Dashboard' },
  ]},
  { label: 'Compliance', items: [
    { id: 'compliance', icon: <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, label: 'Compliance', badge: '3', children: [
      { id: 'calendar', label: 'Compliance Calendar' },
      { id: 'generator', label: 'Document Generator' },
      { id: 'checker', label: 'Applicability Checker' },
      { id: 'register', label: 'Statutory Register' },
      { id: 'filing', label: 'Filing Tracker' },
    ]},
    { id: 'audit', icon: <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />, label: 'Audit', children: [
      { id: 'planner', label: 'Audit Planner' },
      { id: 'checklist', label: 'Checklists' },
      { id: 'findings', label: 'Findings' },
    ]},
    { id: 'legal', icon: <Icon d="M3 6h18M3 12h18M3 18h18" />, label: 'Legal AI', badge: '1', children: [
      { id: 'notices', label: 'Notices & Summons' },
      { id: 'analyzer', label: 'AI Analyzer' },
      { id: 'cases', label: 'Case Tracker' },
    ]},
  ]},
  { label: 'Operations', items: [
    { id: 'payroll', icon: <Icon d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />, label: 'Payroll & Statutory', children: [
      { id: 'salary', label: 'Salary Structure' },
      { id: 'pfesic', label: 'PF / ESIC / PT' },
      { id: 'payslip', label: 'Payslip Generator' },
    ]},
    { id: 'workforce', icon: <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />, label: 'Workforce', children: [
      { id: 'employees', label: 'Employees' },
      { id: 'vendors', label: 'Vendors' },
      { id: 'lifecycle', label: 'Lifecycle' },
    ]},
    { id: 'documents', icon: <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" />, label: 'Documents' },
  ]},
  { label: 'Insights', items: [
    { id: 'reports', icon: <Icon d="M18 20V10M12 20V4M6 20v-6" />, label: 'Analytics & Reports' },
    { id: 'tasks', icon: <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />, label: 'Tasks & Workflow' },
    { id: 'notifications', icon: <Icon d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />, label: 'Notifications' },
  ]},
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  activeView: string;
  onNavigate: (id: string) => void;
}

export function DashboardSidebar({ collapsed, onToggle, activeView, onNavigate }: Props) {
  const [expanded, setExpanded] = useState<string | null>('compliance');
  const toggle = (id: string) => setExpanded(p => p === id ? null : id);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}><LogoSVG /></span>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoName}>Regnix</span>
              <span className={styles.logoBy}>by Leavoo</span>
            </div>
          )}
        </Link>
        <button className={styles.collapseBtn} onClick={onToggle} title="Toggle sidebar">
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV.map(section => (
          <div key={section.label || 'root'}>
            {section.label && !collapsed && (
              <div className={styles.sectionLabel}>{section.label}</div>
            )}
            {section.items.map(item => {
              const isExpanded = expanded === item.id;
              const isActive = activeView === item.id;
              return (
                <div key={item.id}>
                  <button
                    className={`${styles.navItem} ${isActive ? styles.navActive : ''}`}
                    onClick={() => {
                      if (item.children) {
                        toggle(item.id);
                      } else {
                        onNavigate(item.id);
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {!collapsed && <>
                      <span className={styles.navLabel}>{item.label}</span>
                      {item.badge && <span className={styles.badge}>{item.badge}</span>}
                      {item.children && (
                        <span className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </span>
                      )}
                    </>}
                  </button>
                  {!collapsed && item.children && isExpanded && (
                    <div className={styles.subNav}>
                      {item.children.map(c => (
                        <button
                          key={c.id}
                          className={`${styles.subNavItem} ${activeView === c.id ? styles.subNavActive : ''}`}
                          onClick={() => onNavigate(c.id)}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <button
          className={`${styles.navItem} ${activeView === 'settings' ? styles.navActive : ''}`}
          onClick={() => onNavigate('settings')}
          title={collapsed ? 'Settings' : undefined}
        >
          <span className={styles.navIcon}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </span>
          {!collapsed && <span className={styles.navLabel}>Settings</span>}
        </button>
      </div>
    </aside>
  );
}
