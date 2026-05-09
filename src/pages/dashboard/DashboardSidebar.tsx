import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './DashboardSidebar.module.css';

const LogoSVG = () => (
  <svg viewBox="0 0 15 15" fill="none"><path d="M2 3.5C2 2.95 2.45 2.5 3 2.5H7.5C9.43 2.5 11 4.07 11 6C11 7.93 9.43 9.5 7.5 9.5H6.25V12H4.5V9.5H3C2.45 9.5 2 9.05 2 8.5V3.5Z" fill="white"/><path d="M7.5 9.5H8.75L11 12H9.25L7.5 9.5Z" fill="rgba(255,255,255,0.55)"/></svg>
);

interface NavSection { label: string; items: NavItem[]; }
interface NavItem { id: string; icon: string; label: string; badge?: string; children?: { id: string; label: string }[]; }

const NAV: NavSection[] = [
  { label: '', items: [
    { id:'dashboard', icon:'⊞', label:'Dashboard' },
  ]},
  { label: 'Compliance', items: [
    { id:'compliance', icon:'⚖', label:'Compliance', badge:'3', children:[{id:'calendar',label:'Compliance Calendar'},{id:'generator',label:'Document Generator'},{id:'checker',label:'Applicability Checker'},{id:'register',label:'Statutory Register'},{id:'filing',label:'Filing Tracker'}]},
    { id:'audit', icon:'◎', label:'Audit', children:[{id:'planner',label:'Audit Planner'},{id:'checklist',label:'Checklists'},{id:'findings',label:'Findings'}]},
    { id:'legal', icon:'◈', label:'Legal AI', badge:'1', children:[{id:'notices',label:'Notices & Summons'},{id:'analyzer',label:'AI Analyzer'},{id:'cases',label:'Case Tracker'}]},
  ]},
  { label: 'Operations', items: [
    { id:'payroll', icon:'$', label:'Payroll & Statutory', children:[{id:'salary',label:'Salary Structure'},{id:'pfesic',label:'PF / ESIC / PT'},{id:'payslip',label:'Payslip Generator'}]},
    { id:'workforce', icon:'⊕', label:'Workforce', children:[{id:'employees',label:'Employees'},{id:'vendors',label:'Vendors'},{id:'lifecycle',label:'Lifecycle'}]},
    { id:'documents', icon:'□', label:'Documents' },
  ]},
  { label: 'Insights', items: [
    { id:'reports', icon:'▦', label:'Analytics & Reports' },
    { id:'tasks', icon:'✓', label:'Tasks & Workflow' },
    { id:'notifications', icon:'◉', label:'Notifications' },
  ]},
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  activeView: string;           // ← new
  onNavigate: (id: string) => void; // ← new
}

export function DashboardSidebar({ collapsed, onToggle, activeView, onNavigate }: Props) {
  const [expanded, setExpanded] = useState<string|null>('compliance');
  const toggle = (id: string) => setExpanded(p => p === id ? null : id);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}><LogoSVG /></span>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoName}>Regnix</span>
              <span className={styles.logoBy}>by Lexvon</span>
            </div>
          )}
        </Link>
        <button className={styles.collapseBtn} onClick={onToggle} title="Toggle sidebar">
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV.map(section => (
          <div key={section.label}>
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
                      {item.children && <span className={`${styles.chevron} ${isExpanded?styles.chevronOpen:''}`}>›</span>}
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
          <span className={styles.navIcon}>⚙</span>
          {!collapsed && <span className={styles.navLabel}>Settings</span>}
        </button>
      </div>
    </aside>
  );
}
