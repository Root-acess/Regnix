import { useState, useMemo } from 'react';
import styles from './ComplianceCalendar.module.css';
import { COMPLIANCE_DATA, ALL_MONTHS, ALL_STATES, ALL_REGIONS, ComplianceEntry } from './complianceData';

const dateOrder = ['01st','05th','10th','14th','15th','21st','28th','29th','30th','31st'];

function sortByDate(a: string, b: string): number {
  return dateOrder.indexOf(a) - dateOrder.indexOf(b);
}

const REGION_COLORS: Record<string, string> = {
  Central: '#7C3AED',
  East:    '#0891B2',
  North:   '#059669',
  South:   '#D97706',
  West:    '#DC2626',
};

const ACT_COLORS: Record<string, string> = {
  'LWF': '#7C3AED',
  'Emp. Exc': '#0891B2',
  'SHWW': '#059669',
  'MW': '#D97706',
  'PoB': '#DC2626',
  'CLRA': '#9333EA',
  'PoW': '#0284C7',
  'EC': '#16A34A',
  'S&E': '#EA580C',
  'MB': '#BE185D',
  'CL': '#7C3AED',
};

function getActColor(compliance: string): string {
  for (const [key, color] of Object.entries(ACT_COLORS)) {
    if (compliance.startsWith(key)) return color;
  }
  return '#8B85A8';
}

export default function ComplianceCalendar() {
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const monthData = COMPLIANCE_DATA[selectedMonth];

  const filteredEntries = useMemo(() => {
    return monthData.entries.filter(e => {
      if (selectedRegion !== 'All' && e.region !== selectedRegion) return false;
      if (selectedState !== 'All' && e.state !== selectedState) return false;
      if (searchQuery && !e.compliance.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !e.state.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [monthData, selectedRegion, selectedState, searchQuery]);

  const filteredStates = useMemo(() => {
    if (selectedRegion === 'All') return ALL_STATES;
    return ALL_STATES.filter(s => {
      return monthData.entries.some(e => e.state === s && e.region === selectedRegion);
    });
  }, [selectedRegion, monthData]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ComplianceEntry[]> = {};
    for (const entry of filteredEntries) {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push(entry);
    }
    return groups;
  }, [filteredEntries]);

  const sortedDates = Object.keys(groupedByDate).sort(sortByDate);

  const stats = useMemo(() => {
    const stateSet = new Set(filteredEntries.map(e => e.state));
    const actSet = new Set(filteredEntries.map(e => e.compliance.split(' - ')[0]));
    return { total: filteredEntries.length, states: stateSet.size, acts: actSet.size, deadlines: sortedDates.length };
  }, [filteredEntries, sortedDates]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbItem}>Compliance</span>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbActive}>Compliance Calendar</span>
          </div>
          <h1 className={styles.title}>Statutory Compliance Calendar</h1>
          <p className={styles.subtitle}>Track compliance deadlines across all Indian states & territories</p>
        </div>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'timeline' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            <span>⊞</span> Timeline
          </button>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('table')}
          >
            <span>≡</span> Table
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        {[
          { label: 'Total Compliances', value: stats.total, icon: '⚖' },
          { label: 'States Affected', value: stats.states, icon: '◎' },
          { label: 'Acts Covered', value: stats.acts, icon: '□' },
          { label: 'Due Dates', value: stats.deadlines, icon: '◷' },
        ].map(s => (
          <div className={styles.statCard} key={s.label}>
            <span className={styles.statIcon}>{s.icon}</span>
            <div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Month Tabs */}
      <div className={styles.monthNav}>
        {ALL_MONTHS.map(m => {
          const count = COMPLIANCE_DATA[m].entries.length;
          return (
            <button
              key={m}
              className={`${styles.monthTab} ${selectedMonth === m ? styles.monthTabActive : ''}`}
              onClick={() => setSelectedMonth(m)}
            >
              <span className={styles.monthShort}>{m.slice(0, 3)}</span>
              {count > 0 && <span className={styles.monthCount}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            placeholder="Search acts, states..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Region</label>
          <select
            className={styles.filterSelect}
            value={selectedRegion}
            onChange={e => { setSelectedRegion(e.target.value); setSelectedState('All'); }}
          >
            <option value="All">All Regions</option>
            {ALL_REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>State</label>
          <select
            className={styles.filterSelect}
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
          >
            <option value="All">All States</option>
            {filteredStates.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {(selectedRegion !== 'All' || selectedState !== 'All' || searchQuery) && (
          <button
            className={styles.clearFilters}
            onClick={() => { setSelectedRegion('All'); setSelectedState('All'); setSearchQuery(''); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {filteredEntries.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◎</div>
          <div className={styles.emptyTitle}>No compliances found</div>
          <div className={styles.emptyDesc}>Try adjusting your filters or selecting a different month</div>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className={styles.timeline}>
          {sortedDates.map(date => {
            const entries = groupedByDate[date];
            const isExpanded = expandedDate === date;
            const dateNum = parseInt(date);
            const urgency = dateNum <= 5 ? 'high' : dateNum <= 15 ? 'medium' : 'normal';

            return (
              <div key={date} className={`${styles.dateBlock} ${styles[`urgency_${urgency}`]}`}>
                <div className={styles.dateHeader} onClick={() => setExpandedDate(isExpanded ? null : date)}>
                  <div className={styles.datePill}>
                    <span className={styles.dateNum}>{date}</span>
                    <span className={styles.dateMonth}>{selectedMonth.slice(0, 3)}</span>
                  </div>
                  <div className={styles.dateInfo}>
                    <span className={styles.dateEntryCount}>{entries.length} compliance{entries.length !== 1 ? 's' : ''}</span>
                    <div className={styles.regionDots}>
                      {Array.from(new Set(entries.map(e => e.region))).map(r => (
                        <span key={r} className={styles.regionDot} style={{ background: REGION_COLORS[r] }} title={r} />
                      ))}
                    </div>
                  </div>
                  <span className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}>›</span>
                </div>

                <div className={`${styles.entriesGrid} ${isExpanded ? styles.entriesVisible : ''}`}>
                  {entries.map((entry, i) => (
                    <div key={i} className={styles.entryCard}>
                      <div className={styles.entryAccent} style={{ background: getActColor(entry.compliance) }} />
                      <div className={styles.entryBody}>
                        <div className={styles.entryCompliance}>{entry.compliance}</div>
                        <div className={styles.entryMeta}>
                          <span className={styles.entryRegion} style={{ color: REGION_COLORS[entry.region] }}>
                            {entry.region}
                          </span>
                          <span className={styles.entryDot}>·</span>
                          <span className={styles.entryState}>{entry.state}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preview pills when collapsed */}
                {!isExpanded && (
                  <div className={styles.previewPills}>
                    {entries.slice(0, 4).map((e, i) => (
                      <span key={i} className={styles.previewPill} style={{ borderColor: getActColor(e.compliance) }}>
                        {e.compliance.split(' - ')[0]}
                      </span>
                    ))}
                    {entries.length > 4 && (
                      <span className={styles.previewMore}>+{entries.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Due Date</th>
                <th>State</th>
                <th>Region</th>
                <th>Compliance Requirement</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries
                .slice()
                .sort((a, b) => sortByDate(a.date, b.date) || a.state.localeCompare(b.state))
                .map((entry, i) => (
                  <tr key={i} className={i % 2 === 0 ? styles.rowEven : ''}>
                    <td>
                      <span className={styles.tableDatePill}>{entry.date}</span>
                    </td>
                    <td className={styles.tableState}>{entry.state}</td>
                    <td>
                      <span className={styles.tableRegionBadge} style={{ background: `${REGION_COLORS[entry.region]}18`, color: REGION_COLORS[entry.region] }}>
                        {entry.region}
                      </span>
                    </td>
                    <td>
                      <span className={styles.tableAct} style={{ borderLeftColor: getActColor(entry.compliance) }}>
                        {entry.compliance}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
