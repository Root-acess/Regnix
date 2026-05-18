import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import styles from './DocumentGenerator.module.css';

// ─── Output file catalogue ────────────────────────────────────────────────────

const REGISTER_FORMS = [
  { code: 'XX',    name: 'Register of Deductions for Damage or Loss', rule: 'Rule 78(1)(a)(i)'  },
  { code: 'XXI',   name: 'Register of Fines',                         rule: 'Rule 78(1)(a)(ii)' },
  { code: 'XXII',  name: 'Register of Advances',                      rule: 'Rule 78(1)(a)(ii)' },
  { code: 'XXIII', name: 'Register of Overtime',                      rule: 'Rule 78(1)(a)(iii)'},
];

const PROCESS_LOG = [
  'Reading RegnixMain.xlsx master file…',
  'Parsing employee data rows…',
  'Validating column mapping (379 columns)…',
  'Filling Form XX – Register of Deductions…',
  'Filling Form XXI – Register of Fines…',
  'Filling Form XXII – Register of Advances…',
  'Filling Form XXIII – Register of Overtime…',
  'Generating individual payslips per employee…',
  'Applying compliance formulas (PF, ESIC, PT, LWF)…',
  'Preserving template formatting, borders & styles…',
  'Compressing into ZIP archive…',
  'Done ✓',
];

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone({ file, onFile, onClear }: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inp  = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const drop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  if (file) return (
    <div className={styles.filled}>
      <div className={styles.filledIcon}>📊</div>
      <div className={styles.filledMeta}>
        <div className={styles.filledName}>{file.name}</div>
        <div className={styles.filledSize}>{(file.size / 1024).toFixed(1)} KB · Excel workbook</div>
      </div>
      <div className={styles.filledTick}>✓</div>
      <button className={styles.filledReplace} onClick={onClear}>↺ Replace</button>
    </div>
  );

  return (
    <div
      className={`${styles.dz} ${over ? styles.dzOver : ''}`}
      onClick={() => inp.current?.click()}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <input ref={inp} type="file" accept=".xlsx,.xls" hidden
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '';
        }} />
      <div className={styles.dzIcon}>📂</div>
      <div className={styles.dzTitle}>Drop your filled RegnixMain.xlsx here</div>
      <div className={styles.dzHint}>.xlsx only · Must be the official Regnix master template (RegnixMain.xlsx)</div>
      <div className={styles.dzCta}>Click to browse · or drag &amp; drop</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentGenerator() {
  const [file,     setFile]    = useState<File | null>(null);
  const [phase,    setPhase]   = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [logs,     setLogs]    = useState<{ txt: string; ok: boolean }[]>([]);
  const [errMsg,   setErrMsg]  = useState('');
  const [zipBlob,  setZipBlob] = useState<Blob | null>(null);
  const [fileMeta, setFileMeta]= useState<{ names: string[]; rows: number } | null>(null);
  const logEl = useRef<HTMLDivElement>(null);

  const generate = async () => {
    if (!file) return;
    setPhase('processing'); setLogs([]); setErrMsg('');

    const abort = new AbortController();

    // Animate log lines while real API processes
    (async () => {
      for (let i = 0; i < PROCESS_LOG.length - 1; i++) {
        if (abort.signal.aborted) return;
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        setLogs(p => [...p.map(l => ({ ...l, ok: true })), { txt: PROCESS_LOG[i], ok: false }]);
        if (logEl.current) logEl.current.scrollTop = logEl.current.scrollHeight;
      }
    })();

    try {
      const fd = new FormData();
      fd.append('master', file);

      const res = await fetch('/api/generate-docs', {
        method: 'POST',
        body: fd,
        signal: abort.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = `Request failed (${res.status})`;
        try { msg = JSON.parse(text).error || msg; } catch { msg = text || msg; }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const fileCount = parseInt(res.headers.get('X-File-Count') || '0', 10);
      const rowCount  = parseInt(res.headers.get('X-Row-Count')  || '0', 10);
      const rawNames  = res.headers.get('X-File-Names');
      let names: string[] = [];
      try { names = rawNames ? JSON.parse(rawNames) : []; } catch { /* ignore */ }

      setZipBlob(blob);
      setFileMeta({ names, rows: rowCount });
      abort.abort();
      setLogs(p => [...p.map(l => ({ ...l, ok: true })), { txt: PROCESS_LOG[PROCESS_LOG.length - 1], ok: false }]);
      await new Promise(r => setTimeout(r, 600));
      setPhase('done');

    } catch (e: unknown) {
      abort.abort();
      if (e instanceof Error && e.name !== 'AbortError') {
        setErrMsg(e.message);
        setPhase('error');
      }
    }
  };

  const downloadZip = () => {
    if (!zipBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = `Regnix_Workbooks_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
  };

  const reset = () => {
    setFile(null); setPhase('idle'); setLogs([]);
    setErrMsg(''); setZipBlob(null); setFileMeta(null);
  };

  const pct = Math.round(logs.filter(l => l.ok).length / PROCESS_LOG.length * 100);

  // Separate payslip names from register names
  const payslipNames   = fileMeta?.names.filter(n => n.startsWith('Payslip_') || n.startsWith('Regnix_Payslip_')) ?? [];
  const registerNames  = fileMeta?.names.filter(n => !n.startsWith('Payslip_') && !n.endsWith('manifest.json')) ?? [];

  return (
    <div className={styles.page}>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className={styles.pageHead}>
        <div>
          <div className={styles.crumb}>
            <span>Compliance</span><span className={styles.crumbSep}>›</span>
            <span className={styles.crumbNow}>Document Generator</span>
          </div>
          <h1 className={styles.title}>Regnix Document Generator</h1>
          <p className={styles.sub}>
            Upload your filled <strong>RegnixMain.xlsx</strong> master file — we generate all
            statutory registers (Forms XX–XXIII) and individual employee payslips as Excel
            workbooks, preserving the original template format, colours, and borders.
          </p>
        </div>

        <a href="/api/download-template" className={styles.dlTemplateBtn}>
          <span>⬇</span> Download Master Template
        </a>
      </div>

      {/* ── Workflow track ─────────────────────────────────────────── */}
      <div className={styles.track}>
        {[
          { n:'1', t:'Download',  s:'Get RegnixMain.xlsx template',   done: true              },
          { n:'2', t:'Fill Data', s:'Complete all 379 columns',        done: !!file            },
          { n:'3', t:'Upload',    s:'Upload filled master workbook',   done: !!file            },
          { n:'4', t:'Generate',  s:'Get all workbooks + payslips',    done: phase === 'done'  },
        ].map((step, i, arr) => (
          <div key={step.n} className={styles.trackItem}>
            <div className={`${styles.trackBall} ${step.done ? styles.trackDone : ''}`}>
              {step.done ? '✓' : step.n}
            </div>
            <div className={styles.trackText}>
              <div className={styles.trackLabel}>{step.t}</div>
              <div className={styles.trackSub}>{step.s}</div>
            </div>
            {i < arr.length - 1 && (
              <div className={`${styles.trackLine} ${step.done ? styles.trackLineDone : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Two-col layout ─────────────────────────────────────────── */}
      <div className={styles.layout}>

        {/* ═══ LEFT: Upload + Instructions ══════════════════════════ */}
        <div className={styles.left}>

          {/* Upload card */}
          <div className={styles.card}>
            <div className={styles.cardHd}>
              <div className={styles.stepNum}>01</div>
              <div>
                <div className={styles.cardTitle}>Upload Filled Master Workbook</div>
                <div className={styles.cardSub}>RegnixMain.xlsx with all employee & payroll data filled</div>
              </div>
            </div>
            <DropZone file={file} onFile={setFile} onClear={() => setFile(null)} />
          </div>

          {/* Column guide */}
          <div className={styles.card}>
            <div className={styles.cardHd}>
              <div className={styles.stepNum}>ℹ</div>
              <div>
                <div className={styles.cardTitle}>Master File Column Guide</div>
                <div className={styles.cardSub}>379 columns — what goes where</div>
              </div>
            </div>
            <div className={styles.colGuide}>
              {[
                { range:'1–11',    color:'#6366f1', label:'Registration & Establishment details'   },
                { range:'12–30',   color:'#0ea5e9', label:'Contractor & Licence information'        },
                { range:'31–53',   color:'#10b981', label:'Workmen personal & employment details'   },
                { range:'54–86',   color:'#f59e0b', label:'Muster Roll — daily attendance (31 days)'},
                { range:'87–99',   color:'#f43f5e', label:'Wages — basic, DA, OT, deductions'       },
                { range:'100–126', color:'#8b5cf6', label:'Deductions, Fines, Advances, Overtime'   },
                { range:'127–154', color:'#06b6d4', label:'Salary components — HRA, PT, LWF, PF'   },
                { range:'155–299', color:'#64748b', label:'Extended HR — leave, compliance, docs'   },
                { range:'300–379', color:'#0f172a', label:'Employee full profile & statutory IDs'   },
              ].map(g => (
                <div key={g.range} className={styles.colRow}>
                  <span className={styles.colDot} style={{ background: g.color }} />
                  <span className={styles.colRange}>{g.range}</span>
                  <span className={styles.colLabel}>{g.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Output forms info */}
          <div className={styles.card}>
            <div className={styles.cardHd}>
              <div className={styles.stepNum}>⚖</div>
              <div>
                <div className={styles.cardTitle}>Generated Output Files</div>
                <div className={styles.cardSub}>Exact same format as uploaded templates</div>
              </div>
            </div>

            <div className={styles.fGroup}>
              <div className={styles.fGroupHd}>
                <span className={styles.fDot} style={{ background: '#10b981' }} />
                Statutory Registers (CLRA 1970)
              </div>
              {REGISTER_FORMS.map(f => (
                <div key={f.code} className={styles.fRow}>
                  <span className={styles.fCode}>Form {f.code}</span>
                  <span className={styles.fName}>{f.name}</span>
                  <span className={styles.fRule}>{f.rule}</span>
                  <span className={styles.fBadge}>XLSX</span>
                </div>
              ))}
            </div>

            <div className={styles.fGroup} style={{ marginTop: 10 }}>
              <div className={styles.fGroupHd}>
                <span className={styles.fDot} style={{ background: '#6366f1' }} />
                Payslips — one .xlsx per employee
              </div>
              <div className={styles.fRow}>
                <span className={styles.fCode}>Payslip</span>
                <span className={styles.fName}>Individual salary slip with earnings, deductions, compliance &amp; leave</span>
                <span className={styles.fBadge}>XLSX</span>
              </div>
            </div>
          </div>

        </div>

        {/* ═══ RIGHT: Action + Processing + Results ═════════════════ */}
        <div className={styles.right}>

          {/* CTA */}
          {phase === 'idle' && (
            <div className={styles.ctaCard}>
              {!file && (
                <div className={styles.checklist}>
                  <div className={styles.checklistHd}>Complete these steps first</div>
                  <div className={`${styles.checkItem} ${styles.checkOk}`}>
                    <span className={styles.checkBall}>✓</span>
                    Download the master template (RegnixMain.xlsx)
                  </div>
                  <div className={styles.checkItem}>
                    <span className={styles.checkBall}>○</span>
                    Fill all employee data across 379 columns
                  </div>
                  <div className={styles.checkItem}>
                    <span className={styles.checkBall}>○</span>
                    Upload the filled workbook using the panel on the left
                  </div>
                </div>
              )}
              <button
                className={`${styles.genBtn} ${!file ? styles.genOff : ''}`}
                disabled={!file}
                onClick={generate}
              >
                <span>⚡</span>
                Generate All Workbooks {file ? `(${file.name})` : ''}
              </button>
              {file && (
                <p className={styles.genNote}>
                  Will generate 4 statutory register workbooks + one payslip per employee row
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className={styles.errCard}>
              <div className={styles.errIco}>⚠</div>
              <div>
                <div className={styles.errTitle}>Generation failed</div>
                <div className={styles.errBody}>{errMsg}</div>
                <div className={styles.errHelp}>
                  Common causes: Python not installed · openpyxl missing ·
                  template files not in <code>public/templates/</code> ·
                  master file column order changed
                </div>
              </div>
              <button className={styles.errRetry} onClick={reset}>↺ Try again</button>
            </div>
          )}

          {/* Processing */}
          {phase === 'processing' && (
            <div className={styles.procCard}>
              <div className={styles.procHead}>
                <div className={styles.spinner} />
                <div>
                  <div className={styles.procTitle}>Generating workbooks…</div>
                  <div className={styles.procSub}>Python is processing your master file · please wait</div>
                </div>
                <div className={styles.procPct}>{pct}%</div>
              </div>
              <div className={styles.procBar}>
                <div className={styles.procFill} style={{ width: `${pct}%` }} />
              </div>
              <div className={styles.logBox} ref={logEl}>
                {logs.map((l, i) => (
                  <div key={i} className={`${styles.logLine} ${l.ok ? styles.logOk : styles.logCur}`}>
                    <span className={styles.logIco}>{l.ok ? '✓' : '›'}</span>
                    {l.txt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {phase === 'done' && fileMeta && (
            <div className={styles.doneCard}>
              <div className={styles.doneTop}>
                <div className={styles.doneTick}>✓</div>
                <div>
                  <div className={styles.doneTitle}>
                    {fileMeta.names.filter(n => !n.endsWith('manifest.json')).length} workbooks generated
                    &nbsp;from {fileMeta.rows} employee {fileMeta.rows === 1 ? 'record' : 'records'}
                  </div>
                  <div className={styles.doneSub}>
                    All files preserve the original template format, colours, borders &amp; formulas.
                  </div>
                </div>
              </div>

              <div className={styles.doneActions}>
                <button className={styles.doneZip} onClick={downloadZip}>
                  ⬇ Download ZIP Archive
                </button>
                <button className={styles.doneNew} onClick={reset}>↺ New Batch</button>
              </div>

              {/* Registers */}
              {registerNames.length > 0 && (
                <div className={styles.doneSection}>
                  <div className={styles.doneSectHd}>
                    <span className={styles.fDot} style={{ background: '#10b981' }} />
                    Statutory Registers ({registerNames.length})
                  </div>
                  <div className={styles.doneList}>
                    {registerNames.map(name => (
                      <div key={name} className={styles.doneItem}>
                        <span className={styles.doneItemIco}>📋</span>
                        <span className={styles.doneItemName}>{name}</span>
                        <span className={styles.doneItemBadge}>XLSX</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payslips */}
              {payslipNames.length > 0 && (
                <div className={styles.doneSection}>
                  <div className={styles.doneSectHd}>
                    <span className={styles.fDot} style={{ background: '#6366f1' }} />
                    Payslips — {payslipNames.length} employees
                  </div>
                  <div className={styles.doneGrid}>
                    {payslipNames.map(name => {
                      const emp = name.replace('Payslip_', '').replace('.xlsx', '');
                      return (
                        <div key={name} className={styles.doneGridItem}>
                          <span>📄</span>
                          <span className={styles.doneGridCode}>{emp}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
