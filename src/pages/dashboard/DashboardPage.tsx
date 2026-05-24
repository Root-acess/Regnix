import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import ComplianceCalendar from '../../components/dashboard/comlianceCalender/ComplianceCalendar';
import DocumentGenerator from '../../components/dashboard/documentGenerator/DocumentGenerator';
import DashboardHome from './DashboardHome';
import styles from './DashboardPage.module.css';

function renderView(view: string) {
  switch (view) {
    case 'calendar':   return <ComplianceCalendar />;
    case 'generator':  return <DocumentGenerator />;
    default:           return <DashboardHome />;
  }
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ section?: string; sub?: string }>();
  const [collapsed, setCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);

  // Derive active view from URL params
  const activeView = params.sub || params.section || 'dashboard';

  const handleNavigate = (id: string) => {
    if (id === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${id}`);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className={styles.layout}>
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        activeView={activeView}
        onNavigate={handleNavigate}
      />
      <div className={styles.main}>
        <DashboardHeader onAiToggle={() => setAiOpen(v => !v)} aiOpen={aiOpen} />
        <div className={styles.contentRow}>
          <div className={styles.content}>
            {renderView(activeView)}
          </div>
          {aiOpen && <AiAssistantPanel onClose={() => setAiOpen(false)} />}
        </div>
      </div>
    </div>
  );
}

function AiAssistantPanel({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState('');
  const suggestions = [
    'Explain in a nov suggestions',
    'AI Compliant suggestions',
  ];

  return (
    <aside className={styles.aiPanel}>
      <div className={styles.aiHeader}>
        <span className={styles.aiTitle}>AI Assistant</span>
        <button className={styles.aiClose} onClick={onClose}>✕</button>
      </div>
      <div className={styles.aiMessages}>
        <div className={styles.aiMsg}>
          <div className={styles.aiMsgAvatar}>
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M2 3.5C2 2.95 2.45 2.5 3 2.5H7.5C9.43 2.5 11 4.07 11 6C11 7.93 9.43 9.5 7.5 9.5H6.25V12H4.5V9.5H3C2.45 9.5 2 9.05 2 8.5V3.5Z" fill="white"/><path d="M7.5 9.5H8.75L11 12H9.25L7.5 9.5Z" fill="rgba(255,255,255,0.55)"/></svg>
          </div>
          <div className={styles.aiMsgBubble}>
            Hi! I'm your Regnix AI compliance assistant. How can I help you today with compliance, audits, or filing?
          </div>
        </div>
      </div>
      <div className={styles.aiSuggestions}>
        {suggestions.map(s => (
          <button key={s} className={styles.aiSugg} onClick={() => setInput(s)}>{s}</button>
        ))}
      </div>
      <div className={styles.aiInputRow}>
        <input
          className={styles.aiInput}
          placeholder="Type your suggestion..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') setInput(''); }}
        />
        <button className={styles.aiSend} onClick={() => setInput('')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </aside>
  );
}
