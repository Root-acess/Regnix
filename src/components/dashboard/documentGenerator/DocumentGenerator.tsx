import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import styles from './DocumentGenerator.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTO_FORMS = [
  { code: 'III',   rule: '18(3)',         name: 'Register of Registration',                   cols: '0–10'   },
  { code: 'XII',   rule: '74',            name: 'Register of Contractors',                    cols: '11–30'  },
  { code: 'XIII',  rule: '75',            name: 'Register of Workmen by Contractor',          cols: '31–42'  },
  { code: 'XIV',   rule: '76',            name: 'Employment Card',                            cols: '43–48'  },
  { code: 'XV',    rule: '77',            name: 'Service Certificate',                        cols: '49–53'  },
  { code: 'XVI',   rule: '78(1)(a)(i)',   name: 'Muster Roll',                               cols: '54–86'  },
  { code: 'XVII',  rule: '78(1)(a)(i)',   name: 'Register of Wages',                         cols: '87–99'  },
  { code: 'XIX',   rule: '78(1)(b)',      name: 'Wage Slip',                                 cols: '87–99'  },
  { code: 'XX',    rule: '78(1)(a)(i)',   name: 'Register of Deductions for Damage or Loss', cols: '100–108'},
  { code: 'XXI',   rule: '78(1)(a)(ii)',  name: 'Register of Fines',                         cols: '109–112'},
  { code: 'XXII',  rule: '78(1)(a)(ii)',  name: 'Register of Advances',                      cols: '113–119'},
  { code: 'XXIII', rule: '78(1)(a)(iii)', name: 'Register of Overtime',                      cols: '120–154'},
  { code: 'V',     rule: '21(2)',         name: 'Certificate by Principal Employer',          cols: '2–30'   },
  { code: 'V-A',   rule: '24(1-A)',       name: 'Application for Adjustment of Security Deposit', cols: '15–17'},
  { code: 'VI-A',  rule: '25(2)(viii)',   name: 'Notice of Commencement/Completion – Clerical', cols: '2–29' },
  { code: 'VI-B',  rule: '81(3)',         name: 'Notice of Commencement/Completion – Contract', cols: '2–29' },
  { code: 'VIII',  rule: '32(2)',         name: 'Temporary Registration of Establishment',   cols: '0–10'   },
];

const MANUAL_FORMS = [
  { code: 'IV',    rule: '21(1)',  name: 'Application for Licence' },
  { code: 'VI',    rule: '25(1)',  name: 'Licence — Office of Licensing Officer' },
  { code: 'VII',   rule: '29(2)',  name: 'Application for Renewal of Licence' },
  { code: 'X',     rule: '32(2)',  name: 'Application for Temporary Licence' },
  { code: 'XI',    rule: '32(3)',  name: 'Temporary Licence — Licensing Officer' },
  { code: 'XXIV',  rule: '82(1)',  name: 'Return by Contractor to Licensing Officer' },
  { code: 'XXV',   rule: '82(2)',  name: 'Annual Return of Principal Employer' },
];

const COL_GROUPS = [
  { label: 'Registration',         range: '0 – 10',   color: '#6366f1' },
  { label: 'Contractors',          range: '11 – 30',  color: '#0ea5e9' },
  { label: 'Workmen Details',      range: '31 – 53',  color: '#10b981' },
  { label: 'Muster / Attendance',  range: '54 – 86',  color: '#f59e0b' },
  { label: 'Wages & Deductions',   range: '87 – 126', color: '#f43f5e' },
  { label: 'Salary Components',    range: '127 – 154',color: '#8b5cf6' },
];

const PROCESS_LOG = [
  'Parsing master Excel file…',
  'Validating 155 column schema…',
  'Reading workmen records…',
  'Building Form III – Register of Registration…',
  'Building Form XII – Register of Contractors…',
  'Building Form XIII – Workmen Register…',
  'Building Form XIV – Employment Cards…',
  'Building Form XV – Service Certificates…',
  'Building Form XVI – Muster Rolls…',
  'Building Form XVII – Register of Wages…',
  'Building Form XIX – Wage Slips…',
  'Building Form XX – Deductions Register…',
  'Building Form XXI – Fines Register…',
  'Building Form XXII – Advances Register…',
  'Building Form XXIII – Overtime Register…',
  'Stamping company header on all pages…',
  'Stamping company footer & signatory block…',
  `Compressing ${AUTO_FORMS.length} PDFs into ZIP…`,
  'Complete ✓',
];

interface Slot { file: File | null; preview: string | null; }

// ─── DropZone ─────────────────────────────────────────────────────────────────

function DropZone({ slot, accept, icon, label, hint, accent, onFile, onClear }: {
  slot: Slot; accept: string; icon: string; label: string;
  hint: string; accent: string; onFile(f: File): void; onClear(): void;
}) {
  const inp = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const drop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setOver(false);
    const f = e.dataTransfer.files[0]; if (f) onFile(f);
  }, [onFile]);

  if (slot.file) return (
    <div className={styles.slotFilled} style={{ '--accent': accent } as React.CSSProperties}>
      {slot.preview
        ? <img src={slot.preview} alt="" className={styles.slotImg} />
        : <div className={styles.slotFile}>
            <span className={styles.slotFileIco}>{icon}</span>
            <div>
              <div className={styles.slotFileName}>{slot.file.name}</div>
              <div className={styles.slotFileSz}>{(slot.file.size / 1024).toFixed(1)} KB</div>
            </div>
            <div className={styles.slotTick}>✓</div>
          </div>
      }
      <button className={styles.slotReplace} onClick={onClear}>↺ Replace file</button>
    </div>
  );

  return (
    <div
      className={`${styles.dz} ${over ? styles.dzHot : ''}`}
      style={{ '--accent': accent } as React.CSSProperties}
      onClick={() => inp.current?.click()}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <input ref={inp} type="file" accept={accept} hidden
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '';
        }} />
      <div className={styles.dzGlow} />
      <div className={styles.dzIcon}>{icon}</div>
      <div className={styles.dzLabel}>{label}</div>
      <div className={styles.dzHint}>{hint}</div>
      <div className={styles.dzCta}>Click to browse · or drag &amp; drop</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentGenerator() {
  const [header,     setH] = useState<Slot>({ file: null, preview: null });
  const [master,     setM] = useState<Slot>({ file: null, preview: null });
  const [footer,     setF] = useState<Slot>({ file: null, preview: null });
  const [phase,   setPhase] = useState<'idle'|'processing'|'done'|'error'>('idle');
  const [logs,     setLogs] = useState<{ txt: string; ok: boolean }[]>([]);
  const [errMsg,  setErrMsg] = useState('');
  const [zipBlob, setZip]   = useState<Blob|null>(null);
  const logEl = useRef<HTMLDivElement>(null);

  const mkSlot = (key: 'h'|'m'|'f', file: File) => {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    if (key==='h') setH({ file, preview });
    if (key==='m') setM({ file, preview });
    if (key==='f') setF({ file, preview });
  };
  const clrSlot = (key: 'h'|'m'|'f') => {
    const clr = (s: Slot) => { if (s.preview) URL.revokeObjectURL(s.preview); };
    if (key==='h') { clr(header); setH({ file:null, preview:null }); }
    if (key==='m') { clr(master); setM({ file:null, preview:null }); }
    if (key==='f') { clr(footer); setF({ file:null, preview:null }); }
  };

  const ready = !!header.file && !!master.file && !!footer.file;
  const count = [header,master,footer].filter(s=>s.file).length;

  const generate = async () => {
    if (!ready) return;
    setPhase('processing'); setLogs([]); setErrMsg('');
    const ctrl = new AbortController();

    // Animate logs while real API runs
    (async () => {
      for (let i = 0; i < PROCESS_LOG.length - 1; i++) {
        if (ctrl.signal.aborted) return;
        await new Promise(r => setTimeout(r, 520 + Math.random() * 300));
        setLogs(p => [...p.map(l=>({...l, ok:true})), { txt: PROCESS_LOG[i], ok: false }]);
        if (logEl.current) logEl.current.scrollTop = logEl.current.scrollHeight;
      }
    })();

    try {
      const fd = new FormData();
      fd.append('header', header.file!);
      fd.append('master', master.file!);
      fd.append('footer', footer.file!);
      const res = await fetch('/api/generate-docs', { method:'POST', body:fd, signal:ctrl.signal });
      if (!res.ok) throw new Error(await res.json().then((d:{error?:string})=>d.error||'Server error').catch(()=>'Server error'));
      const blob = await res.blob();
      setZip(blob);
      ctrl.abort();
      setLogs(p => [...p.map(l=>({...l,ok:true})), { txt: PROCESS_LOG[PROCESS_LOG.length-1], ok:false }]);
      await new Promise(r=>setTimeout(r,700));
      setPhase('done');
    } catch(e:unknown) {
      ctrl.abort();
      if (e instanceof Error && e.name!=='AbortError') {
        setErrMsg(e.message); setPhase('error');
      }
    }
  };

  const download = () => {
    if (!zipBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = `Regnix_CLRA_Forms_${new Date().toISOString().slice(0,10)}.zip`;
    a.click();
  };

  const reset = () => {
    clrSlot('h'); clrSlot('m'); clrSlot('f');
    setPhase('idle'); setLogs([]); setErrMsg(''); setZip(null);
  };

  const pct = logs.filter(l=>l.ok).length / PROCESS_LOG.length * 100;

  return (
    <div className={styles.page}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.crumb}>
            <span>Compliance</span><span className={styles.crumbSep}>›</span>
            <span className={styles.crumbNow}>Document Generator</span>
          </div>
          <h1 className={styles.h1}>CLRA Form Generator</h1>
          <p className={styles.sub}>
            Upload your filled master Excel + company branding — instantly generate all&nbsp;
            <strong>{AUTO_FORMS.length} statutory PDFs</strong> under the Contract Labour (R&amp;A) Act, 1970.
          </p>
        </div>

        {/* Progress ring */}
        <div className={styles.ring}>
          <svg viewBox="0 0 72 72" className={styles.ringSvg}>
            <circle cx="36" cy="36" r="30" fill="none" stroke="#e5e7eb" strokeWidth="5"/>
            <circle cx="36" cy="36" r="30" fill="none" stroke="url(#rg)" strokeWidth="5"
              strokeDasharray={`${count/3*188.5} 188.5`} strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{transition:'stroke-dasharray .5s ease'}}/>
            <defs>
              <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
          <div className={styles.ringInner}>
            <span className={styles.ringNum}>{count}</span>
            <span className={styles.ringOf}>/3</span>
          </div>
          <div className={styles.ringLabel}>assets ready</div>
        </div>
      </div>

      {/* ── Workflow track ─────────────────────────────────────────── */}
      <div className={styles.track}>
        {[
          { n:'1', t:'Download',  s:'Get master template',            done: true },
          { n:'2', t:'Fill Data', s:'Complete all 155 columns',       done: !!master.file },
          { n:'3', t:'Upload',    s:'Header · Excel · Footer',        done: ready },
          { n:'4', t:'Generate',  s:`${AUTO_FORMS.length} PDFs auto-built`, done: phase==='done' },
        ].map((step, i, arr) => (
          <div className={styles.trackItem} key={step.n}>
            <div className={`${styles.trackBall} ${step.done?styles.trackDone:''}`}>
              {step.done ? '✓' : step.n}
            </div>
            <div className={styles.trackText}>
              <div className={styles.trackTitle}>{step.t}</div>
              <div className={styles.trackSub}>{step.s}</div>
            </div>
            {i < arr.length-1 && (
              <div className={`${styles.trackLine} ${step.done?styles.trackLineFull:''}`}/>
            )}
          </div>
        ))}
      </div>

      {/* ── Two-col layout ─────────────────────────────────────────── */}
      <div className={styles.layout}>

        {/* ═══ LEFT column ═══════════════════════════════════════════ */}
        <div className={styles.left}>

          {/* 01 Download */}
          <div className={styles.card}>
            <div className={styles.cardHd}>
              <div className={styles.stepBadge} style={{background:'#6366f1'}}>01</div>
              <div>
                <div className={styles.cardTitle}>Download Master Template</div>
                <div className={styles.cardSub}>Fill every column before uploading — do not rename or reorder</div>
              </div>
            </div>

            <div className={styles.dlBox}>
              <div className={styles.dlBoxLeft}>
                <div className={styles.dlEmoji}>📊</div>
                <div>
                  <div className={styles.dlName}>Regnix_Master_Template.xlsx</div>
                  <div className={styles.dlMeta}>155 columns · Covers all 17 auto-generated forms</div>
                </div>
              </div>
              <a href="/Regnix.xlsx" download className={styles.dlBtn}>
                <span>⬇</span> Download
              </a>
            </div>

            <div className={styles.colMap}>
              {COL_GROUPS.map(g => (
                <div key={g.label} className={styles.colMapItem}>
                  <span className={styles.colDot} style={{background:g.color}}/>
                  <span className={styles.colRange}>{g.range}</span>
                  <span className={styles.colLabel}>{g.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 02 Header upload */}
          <div className={`${styles.card} ${header.file?styles.cardOk:''}`}>
            <div className={styles.cardHd}>
              <div className={styles.stepBadge} style={{background: header.file?'#10b981':'#6366f1'}}>
                {header.file?'✓':'02'}
              </div>
              <div>
                <div className={styles.cardTitle}>Company Header</div>
                <div className={styles.cardSub}>Letterhead / logo — printed at top of every PDF page</div>
              </div>
            </div>
            <DropZone
              slot={header} accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              icon="🖼" label="Upload header image"
              hint="PNG · JPG · SVG  ·  Ideal: 2480 × 200 px, transparent bg"
              accent="#6366f1"
              onFile={f=>mkSlot('h',f)} onClear={()=>clrSlot('h')}
            />
          </div>

          {/* 03 Master file upload */}
          <div className={`${styles.card} ${master.file?styles.cardOk:''}`}>
            <div className={styles.cardHd}>
              <div className={styles.stepBadge} style={{background: master.file?'#10b981':'#6366f1'}}>
                {master.file?'✓':'03'}
              </div>
              <div>
                <div className={styles.cardTitle}>Master Data File</div>
                <div className={styles.cardSub}>Filled Regnix .xlsx — column order must be preserved exactly</div>
              </div>
            </div>
            <DropZone
              slot={master} accept=".xlsx,.xls"
              icon="📊" label="Upload filled Excel"
              hint=".xlsx only  ·  Must contain all 155 columns from the template"
              accent="#10b981"
              onFile={f=>mkSlot('m',f)} onClear={()=>clrSlot('m')}
            />
          </div>

          {/* 04 Footer upload */}
          <div className={`${styles.card} ${footer.file?styles.cardOk:''}`}>
            <div className={styles.cardHd}>
              <div className={styles.stepBadge} style={{background: footer.file?'#10b981':'#6366f1'}}>
                {footer.file?'✓':'04'}
              </div>
              <div>
                <div className={styles.cardTitle}>Company Footer</div>
                <div className={styles.cardSub}>Authorised signatory block — printed at bottom of every page</div>
              </div>
            </div>
            <DropZone
              slot={footer} accept="image/png,image/jpeg,image/jpg"
              icon="🖋" label="Upload footer image"
              hint="PNG · JPG  ·  Ideal: 2480 × 150 px, includes signature block"
              accent="#f59e0b"
              onFile={f=>mkSlot('f',f)} onClear={()=>clrSlot('f')}
            />
          </div>

        </div>

        {/* ═══ RIGHT column ══════════════════════════════════════════ */}
        <div className={styles.right}>

          {/* Document mock */}
          <div className={styles.card}>
            <div className={styles.cardHd}>
              <div className={styles.stepBadge} style={{background:'#8b5cf6'}}>◉</div>
              <div>
                <div className={styles.cardTitle}>Live Preview</div>
                <div className={styles.cardSub}>Your branded form layout</div>
              </div>
            </div>

            <div className={styles.mock}>
              <div className={`${styles.mockHdr} ${header.file?styles.mockZoneFull:''}`}>
                {header.preview
                  ? <img src={header.preview} alt="" className={styles.mockZoneImg}/>
                  : <div className={styles.mockZonePh}><span>▤</span> Company Header</div>
                }
              </div>

              <div className={styles.mockBody}>
                {master.file ? (
                  <div className={styles.mockContent}>
                    <div className={styles.mockFormTitle}>FORM XIII — Register of Workmen Employed by Contractor</div>
                    <div className={styles.mockFormSub}>[See rule 75] · Contract Labour (R&amp;A) Act, 1970</div>
                    <div className={styles.mockLines}>
                      {[90,68,82,55,76,88,61,74].map((w,i) => (
                        <div key={i} className={styles.mockLine} style={{width:`${w}%`, animationDelay:`${i*80}ms`}}/>
                      ))}
                    </div>
                    <div className={styles.mockGrid}>
                      {['Sl.No','Name','Designation','Wage Rate','Date Joined'].map(h=>(
                        <div key={h} className={styles.mockGridCell}>{h}</div>
                      ))}
                    </div>
                    <div className={styles.mockDataRow}>
                      {['01','As per data','As per data','As per data','As per data'].map((v,i)=>(
                        <div key={i} className={styles.mockGridCell} style={{opacity:0.45}}>{v}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.mockEmpty}>
                    <div className={styles.mockEmptyIco}>📄</div>
                    <div>Upload master file to preview</div>
                  </div>
                )}
              </div>

              <div className={`${styles.mockFtr} ${footer.file?styles.mockZoneFull:''}`}>
                {footer.preview
                  ? <img src={footer.preview} alt="" className={styles.mockZoneImg}/>
                  : <div className={styles.mockZonePh}><span>▤</span> Company Footer / Signature</div>
                }
              </div>
            </div>
          </div>

          {/* Forms catalogue */}
          <div className={styles.card}>
            <div className={styles.cardHd}>
              <div className={styles.stepBadge} style={{background:'#0ea5e9'}}>⚖</div>
              <div>
                <div className={styles.cardTitle}>All CLRA Statutory Forms</div>
                <div className={styles.cardSub}>{AUTO_FORMS.length} auto-generated · {MANUAL_FORMS.length} manual reference</div>
              </div>
            </div>

            <div className={styles.fSect}>
              <div className={styles.fSectHd}>
                <span className={styles.fSectDot} style={{background:'#10b981'}}/>
                Auto-generated from your master Excel
                <span className={styles.fSectCount}>{AUTO_FORMS.length}</span>
              </div>
              <div className={styles.fList}>
                {AUTO_FORMS.map(f => (
                  <div key={f.code} className={styles.fRow}>
                    <div className={styles.fRowLeft}>
                      <span className={styles.fCode}>Form {f.code}</span>
                      <span className={styles.fName}>{f.name}</span>
                    </div>
                    <div className={styles.fRowRight}>
                      <span className={styles.fRule}>Rule {f.rule}</span>
                      <span className={styles.fTag} style={{color:'#10b981',background:'rgba(16,185,129,.08)',borderColor:'rgba(16,185,129,.25)'}}>PDF</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.fSect} style={{marginTop:12}}>
              <div className={styles.fSectHd}>
                <span className={styles.fSectDot} style={{background:'#f59e0b'}}/>
                Manual reference templates (fill by hand)
                <span className={styles.fSectCount}>{MANUAL_FORMS.length}</span>
              </div>
              <div className={styles.fList}>
                {MANUAL_FORMS.map(f => (
                  <div key={f.code} className={`${styles.fRow} ${styles.fRowManual}`}>
                    <div className={styles.fRowLeft}>
                      <span className={styles.fCode}>Form {f.code}</span>
                      <span className={styles.fName}>{f.name}</span>
                    </div>
                    <div className={styles.fRowRight}>
                      <span className={styles.fRule}>Rule {f.rule}</span>
                      <span className={styles.fTag} style={{color:'#f59e0b',background:'rgba(245,158,11,.08)',borderColor:'rgba(245,158,11,.25)'}}>DOC</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── CTA / Processing / Done / Error ──────────────────── */}

          {phase === 'idle' && (
            <div className={styles.ctaCard}>
              {!ready && (
                <div className={styles.checklist}>
                  <div className={styles.checklistTitle}>Complete these steps to generate</div>
                  <div className={`${styles.checkItem} ${header.file?styles.checkDone:''}`}>
                    <span className={styles.checkBullet}>{header.file?'✓':'○'}</span>
                    Upload company header image
                  </div>
                  <div className={`${styles.checkItem} ${master.file?styles.checkDone:''}`}>
                    <span className={styles.checkBullet}>{master.file?'✓':'○'}</span>
                    Upload filled master Excel file
                  </div>
                  <div className={`${styles.checkItem} ${footer.file?styles.checkDone:''}`}>
                    <span className={styles.checkBullet}>{footer.file?'✓':'○'}</span>
                    Upload company footer image
                  </div>
                </div>
              )}
              <button className={`${styles.genBtn} ${!ready?styles.genOff:''}`} disabled={!ready} onClick={generate}>
                <span className={styles.genIco}>⚡</span>
                Generate All {AUTO_FORMS.length} Compliance Forms
              </button>
              {ready && <div className={styles.genNote}>All {AUTO_FORMS.length} forms will be generated and packaged into a single ZIP</div>}
            </div>
          )}

          {phase === 'error' && (
            <div className={styles.errCard}>
              <div className={styles.errTop}>
                <span className={styles.errIco}>⚠</span>
                <div>
                  <div className={styles.errTitle}>Generation failed</div>
                  <div className={styles.errMsg}>{errMsg}</div>
                </div>
              </div>
              <button className={styles.errRetry} onClick={()=>{ setPhase('idle'); setErrMsg(''); }}>↺ Try again</button>
            </div>
          )}

          {phase === 'processing' && (
            <div className={styles.procCard}>
              <div className={styles.procTop}>
                <div className={styles.procSpinner}/>
                <div>
                  <div className={styles.procTitle}>Generating your compliance forms…</div>
                  <div className={styles.procSub}>Please wait · do not close this page</div>
                </div>
                <div className={styles.procPct}>{Math.round(pct)}%</div>
              </div>
              <div className={styles.procBar}><div className={styles.procFill} style={{width:`${pct}%`}}/></div>
              <div className={styles.logScroll} ref={logEl}>
                {logs.map((l,i) => (
                  <div key={i} className={`${styles.logRow} ${l.ok?styles.logOk:styles.logCur}`}>
                    <span className={styles.logIco}>{l.ok?'✓':'›'}</span>
                    {l.txt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className={styles.doneCard}>
              <div className={styles.doneTop}>
                <div className={styles.doneTick}>✓</div>
                <div>
                  <div className={styles.doneTitle}>{AUTO_FORMS.length} forms generated successfully</div>
                  <div className={styles.doneSub}>Header &amp; footer applied · Ready to download</div>
                </div>
              </div>
              <div className={styles.doneActions}>
                <button className={styles.doneZip} onClick={download}>⬇ Download ZIP Archive</button>
                <button className={styles.doneNew} onClick={reset}>↺ New Batch</button>
              </div>
              <div className={styles.doneGrid}>
                {AUTO_FORMS.map(f => (
                  <div key={f.code} className={styles.doneItem}>
                    <span className={styles.doneIco}>📄</span>
                    <div className={styles.doneInfo}>
                      <span className={styles.doneCode}>Form {f.code}</span>
                      <span className={styles.doneName}>{f.name}</span>
                    </div>
                    <button className={styles.doneDl} title="Download">↓</button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
