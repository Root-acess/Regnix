
import styles from './DashboardHome.module.css';

// ── Mini Components ──────────────────────────────────────────────
function GaugeChart({ value, color }: { value: number; color: string }) {
  const r = 52, cx = 60, cy = 62;
  const circ = Math.PI * r; // half circle
  const offset = circ - (value / 100) * circ;
  return (
    <svg width="120" height="76" viewBox="0 0 120 76">
      <path d={`M 8 62 A ${r} ${r} 0 0 1 112 62`} fill="none" stroke="#EEEAFF" strokeWidth="10" strokeLinecap="round" />
      <path d={`M 8 62 A ${r} ${r} 0 0 1 112 62`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0F0A1E">{value}%</text>
    </svg>
  );
}

function MiniSparkline() {
  const pts = [40,55,45,60,50,70,58,75,65,80,72,78];
  const max = 90, min = 30, w = 140, h = 36;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - ((v - min) / (max - min)) * h);
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={d} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarMini() {
  const today = 16;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const cells: (number|null)[] = [null,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,null,null];
  return (
    <div className={styles.calMini}>
      <div className={styles.calHeader}>
        <button className={styles.calNav}>‹</button>
        <span className={styles.calMonthLabel}>May 2026</span>
        <button className={styles.calNav}>›</button>
      </div>
      <div className={styles.calTabs}>
        {['Monthly Returns','Quarterly Retuns','Annual Filings'].map((t,i) => (
          <span key={t} className={`${styles.calTab} ${i===0?styles.calTabActive:''}`}>{t}</span>
        ))}
      </div>
      <div className={styles.calGrid}>
        {days.map(d => <div key={d} className={styles.calDow}>{d}</div>)}
        {cells.map((c, i) => (
          <div key={i} className={`${styles.calCell} ${c===today?styles.calToday:''} ${c===3||c===24?styles.calDot:''}`}>
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingActionRow({ num, text, sub, color }: { num: number; text: string; sub: string; color: string }) {
  return (
    <div className={styles.paRow}>
      <div className={styles.paBadge} style={{ background: color }}>{num}</div>
      <div className={styles.paInfo}>
        <div className={styles.paText}>{text}</div>
        <div className={styles.paSub}>{sub}</div>
      </div>
      <button className={styles.fixBtn} style={{ borderColor: color, color }}>Fix Now</button>
    </div>
  );
}

function WorkflowRow({ num, text, daysLeft }: { num: number; text: string; daysLeft: number }) {
  return (
    <div className={styles.wfRow}>
      <span className={styles.wfNum}>{num}</span>
      <span className={styles.wfText}>{text} · <span className={styles.wfDays}>{daysLeft} days left</span></span>
      <div className={styles.wfActions}>
        <button className={styles.approveBtn}>Approve</button>
        <button className={styles.rejectBtn}>Reject</button>
      </div>
    </div>
  );
}

// ── Map SVG (simplified India) ────────────────────────────────────
function IndiaHeatmap() {
  return (
    <div className={styles.mapContainer}>
      <svg viewBox="0 0 300 380" className={styles.mapSvg}>
        {/* Simplified India states as colored regions */}
        <ellipse cx="150" cy="80" rx="60" ry="50" fill="#FCD34D" opacity="0.7" />
        <ellipse cx="100" cy="150" rx="50" ry="55" fill="#EF4444" opacity="0.7" />
        <ellipse cx="195" cy="140" rx="45" ry="40" fill="#FCA5A5" opacity="0.7" />
        <ellipse cx="150" cy="210" rx="55" ry="50" fill="#FCD34D" opacity="0.7" />
        <ellipse cx="85" cy="240" rx="40" ry="35" fill="#6EE7B7" opacity="0.7" />
        <ellipse cx="215" cy="220" rx="38" ry="40" fill="#FCA5A5" opacity="0.7" />
        <ellipse cx="150" cy="290" rx="35" ry="40" fill="#FCD34D" opacity="0.7" />
        <ellipse cx="100" cy="310" rx="30" ry="25" fill="#6EE7B7" opacity="0.7" />
        <ellipse cx="195" cy="295" rx="28" ry="30" fill="#EF4444" opacity="0.7" />
        <ellipse cx="150" cy="355" rx="22" ry="22" fill="#FCA5A5" opacity="0.7" />
        {/* Labels */}
        <text x="92" y="150" fontSize="9" fill="#0F0A1E" fontWeight="600">North</text>
        <text x="78" y="240" fontSize="9" fill="#0F0A1E" fontWeight="600">West</text>
        <text x="155" y="210" fontSize="9" fill="#0F0A1E" fontWeight="600">Central</text>
        <text x="155" y="310" fontSize="9" fill="#0F0A1E" fontWeight="600">South</text>
        <text x="205" y="200" fontSize="9" fill="#0F0A1E" fontWeight="600">East</text>
      </svg>
      <div className={styles.mapLegend}>
        <div className={styles.legendTitle}>Risk Legend</div>
        {[['#EF4444','High'],['#FCD34D','Medium'],['#FCA5A5','Meder'],['#6EE7B7','Low']].map(([c,l]) => (
          <div key={l} className={styles.legendItem}>
            <span className={styles.legendDot} style={{background: c}} />
            <span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Timeline Bars ─────────────────────────────────────────────────
function TimelineBar({ label, pastW, nextW, pastColor, nextColor }: { label: string; pastW: number; nextW: number; pastColor: string; nextColor: string }) {
  return (
    <div className={styles.tlRow}>
      <div className={styles.tlLabel}>{label}</div>
      <div className={styles.tlBars}>
        <div className={styles.tlBar} style={{ width: `${pastW}%`, background: pastColor }} />
        <div className={styles.tlBar} style={{ width: `${nextW}%`, background: nextColor }} />
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function DashboardHome() {
  

  return (
    <div className={styles.page}>

      {/* ── ROW 1: Compliance Chief Cockpit ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>COMPLIANCE CHIEF COCKPIT</span>
        </div>
        <div className={styles.cockpitGrid}>

          {/* Health Score */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>COMPLIANCE HEALTH SCORE</div>
            <div className={styles.healthGauge}>
              <GaugeChart value={94} color="#059669" />
              <MiniSparkline />
            </div>
            <button className={styles.explainBtn}>Explain this score</button>
          </div>

          {/* Audit Readiness */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>AUDIT READINESS</div>
            <div className={styles.healthGauge}>
              <GaugeChart value={88} color="#7C3AED" />
            </div>
            <div className={styles.auditStatus}>
              <span className={styles.statusLink}>Status</span>
              <span className={styles.statusSep}>·</span>
              <span className={styles.gapLink}>Gap Analysis ›</span>
            </div>
          </div>

          {/* Workflow Approvals */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>WORKFLOW APPROVALS</div>
            {[
              { n: 4, t: 'Pending Filings', s: 'Pending Filings | Compilation' },
              { n: 3, t: 'Critical Validations', s: 'Critical Validations | Description De…' },
              { n: 1, t: 'Exsping Documents', s: 'Approvals Approvals' },
            ].map(item => (
              <div key={item.t} className={styles.wfApprovalRow}>
                <span className={styles.wfApprovalNum}>{item.n}</span>
                <div>
                  <div className={styles.wfApprovalTitle}>{item.t}</div>
                  <div className={styles.wfApprovalSub}>{item.s}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Approvals Detail */}
          <div className={styles.card} style={{ gridColumn: 'span 1' }}>
            <div className={styles.cardLabelRow}>
              <span className={styles.cardLabel}>WORKFLOW APPROVALS</span>
              <div className={styles.cardDots}>···</div>
            </div>
            {[1,2,3].map(n => <WorkflowRow key={n} num={n} text="Review Q3 Payroll Audit" daysLeft={2} />)}
          </div>

          {/* Contractor Compliance */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>CONTRACTOR COMPLIANCE OVERVIEW</div>
            <table className={styles.contractorTable}>
              <tbody>
                <tr><td>Total Contractors:</td><td className={styles.tNum}>540</td></tr>
                <tr><td>Fully Compliant:</td><td className={styles.tNumGreen}>512</td></tr>
                <tr><td>Missing Docs:</td><td className={styles.tNumRed}>28</td></tr>
              </tbody>
            </table>
            <button className={styles.detailsBtn}>Details</button>
          </div>
        </div>
      </section>

      {/* ── ROW 2: Operational Governance ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>OPERATIONAL GOVERNANCE</span>
        </div>
        <div className={styles.opsGrid}>

          {/* Pending Actions */}
          <div className={styles.card}>
            <div className={styles.cardLabelRow}>
              <span className={styles.cardLabel}>PENDING ACTIONS</span>
              <button className={styles.fixAllBtn}>Fix All</button>
            </div>
            <div className={styles.pendingScroll}>
              <PendingActionRow num={7} text="Pending Filings" sub="" color="#7C3AED" />
              <button className={styles.viewAllBtn}>View All ∨</button>
              <PendingActionRow num={5} text="Critical Validations" sub="Approvals Aervors | Descrip…" color="#DC2626" />
              <PendingActionRow num={5} text="Approvals Required" sub="Approvals Requvels | Times…" color="#DC2626" />
              <PendingActionRow num={2} text="Employee Manageme…" sub="Employee Liceusen | Times…" color="#D97706" />
              <PendingActionRow num={2} text="Expring Licenses" sub="Exaping Licenses | Documen…" color="#D97706" />
              <PendingActionRow num={12} text="Missing Documents" sub="Missing Documents | Missi…" color="#DC2626" />
            </div>
          </div>

          {/* Filing Calendar */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>FILING CALENDAR</div>
            <CalendarMini />
          </div>

          {/* Live Registers */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>LIVE REGISTERS & FORMS</div>
            <table className={styles.regsTable}>
              <thead>
                <tr>
                  <th>Field name</th>
                  <th>Data source *</th>
                  <th>Stat</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Sarah Jenkins','Data analyse','Data'],
                  ['Field usage *','Components','Data'],
                  ['Recnatita Compli…','Hover tooltip','Data'],
                  ['Audit Rirkck','Filing Delay','Data'],
                ].map(([a,b,c]) => (
                  <tr key={a}>
                    <td>{a}</td><td>{b}</td><td>{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── ROW 3: Intelligent Insights ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>INTELLIGENT INSIGHTS</span>
        </div>
        <div className={styles.insightsGrid}>

          {/* Heatmap */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>RISK INTELLIGENCE HEATMAP</div>
            <IndiaHeatmap />
          </div>

          {/* Smart Recommendations */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>SMART RECOMMENDATIONS & SELF-HEALING</div>
            <div className={styles.aiInsightsLabel}>Smart AI Insights</div>
            <div className={styles.aiInsightGrid}>
              {[
                { c:'green', t:'PF mismatch repeated for 3 months in Bengaluro branch' },
                { c:'red', t:'High audit risk detected for to can be nising Form 19' },
                { c:'amber', t:'High audit risk detected in Komataka brunch due to missing Form 12' },
                { c:'red', t:'7 common ervers Identified that can be auto-fixed now' },
              ].map((ins, i) => (
                <div key={i} className={`${styles.insightPill} ${styles['ins_'+ins.c]}`}>
                  <span className={styles.insDot} />
                  {ins.t}
                </div>
              ))}
            </div>
            <div className={styles.selfHealLabel}>Self-Healing Suggestions</div>
            {[
              'Auto-correct 7 Karnataka missing forms',
              'Auto-correct 7 Karnataka mand forms',
              'Auto-correct 3 Karnataka messngs',
            ].map((s, i) => (
              <div key={i} className={styles.healRow}>
                <span className={styles.healNum}>{i+1}</span>
                <div className={styles.healInfo}>
                  <div className={styles.healTitle}>{s}</div>
                  <div className={styles.healSub}>Problem description: {i===0?'Ade Karnataka missing forms.':i===1?'Ade Karnataka missing forms eneolec…':'fieo carniibra missing forms.'}</div>
                </div>
                <button className={styles.applyBtn}>Apply Fix</button>
              </div>
            ))}
          </div>

          {/* Compliance Timeline */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>COMPLIANCE TIMELINE</div>
            <div className={styles.tlLegend}>
              <span className={styles.tlLegPast}>Past 6 months</span>
              <span className={styles.tlLegNext}>Next 6 months</span>
            </div>
            <div className={styles.tlChart}>
              <TimelineBar label="Regulatory Updates" pastW={55} nextW={20} pastColor="#93C5FD" nextColor="#BFDBFE" />
              <TimelineBar label="Internal Audits" pastW={30} nextW={45} pastColor="#FCA5A5" nextColor="#FCD34D" />
              <TimelineBar label="Filing Milestones" pastW={70} nextW={60} pastColor="#FCD34D" nextColor="#86EFAC" />
            </div>
            <div className={styles.tlAxis}>
              <span>Past</span><span>Next 6</span>
            </div>
          </div>

          {/* Advanced Reporting */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>ADVANCED REPORTING HUB</div>
            <div className={styles.reportSubLabel}>Auto Generated Reports</div>
            <div className={styles.reportDonut}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="40" fill="none" stroke="#EEEAFF" strokeWidth="18" />
                <circle cx="55" cy="55" r="40" fill="none" stroke="#7C3AED" strokeWidth="18"
                  strokeDasharray="100 152" strokeDashoffset="38" strokeLinecap="round" />
                <circle cx="55" cy="55" r="40" fill="none" stroke="#FCD34D" strokeWidth="18"
                  strokeDasharray="60 192" strokeDashoffset="-62" strokeLinecap="round" />
                <circle cx="55" cy="55" r="40" fill="none" stroke="#059669" strokeWidth="18"
                  strokeDasharray="45 207" strokeDashoffset="-122" strokeLinecap="round" />
              </svg>
              <div className={styles.reportLabel}>Smart Reports</div>
            </div>
            <div className={styles.reportBtns}>
              {['Cross-functional Reports ∨'].map(b => (
                <button key={b} className={styles.reportDropBtn}>{b}</button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
