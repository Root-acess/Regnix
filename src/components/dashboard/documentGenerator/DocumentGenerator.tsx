import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import styles from './DocumentGenerator.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type StepId = 'header' | 'master' | 'footer' | 'generate';

interface UploadSlot {
  file: File | null;
  preview: string | null; // for images
}

interface Uploads {
  header: UploadSlot;
  master: UploadSlot;
  footer: UploadSlot;
}

interface ProcessingLog {
  text: string;
  done: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS: { id: StepId; icon: string; label: string; sub: string }[] = [
  { id: 'header',   icon: '▤',  label: 'Company Header', sub: 'Upload your letterhead / logo image' },
  { id: 'master',   icon: '⊞',  label: 'Master Data',    sub: 'Upload filled Regnix master file (.xlsx)' },
  { id: 'footer',   icon: '▤',  label: 'Company Footer', sub: 'Upload your footer / signature image' },
  { id: 'generate', icon: '⚡', label: 'Generate',       sub: 'Review & generate all compliance forms' },
];

const FORMS_GENERATED = [
  'Form XIII – Register of Workmen',
  'Form XIV – Employment Card',
  'Form XV – Service Certificate',
  'Form XVI – Muster Roll',
  'Form XVII – Register of Wages',
  'Form XVIII – Wage Slip',
  'Form XIX – Register of Deductions',
  'Form XX – Register of Fines',
  'Form XXI – Register of Advances',
  'Form XXII – Register of Overtime',
  'Form XXIII – Overtime Wages',
];

const PROCESSING_LOGS: string[] = [
  'Parsing master data file…',
  'Validating 155 column fields…',
  'Reading company header image…',
  'Reading company footer image…',
  'Mapping workmen data to Form XIII…',
  'Generating employment cards (Form XIV)…',
  'Building service certificates (Form XV)…',
  'Compiling muster roll (Form XVI)…',
  'Populating wage registers (Form XVII–XIX)…',
  'Processing deductions & overtime data…',
  'Applying PF / ESIC / PT calculations…',
  'Composing PDF layouts with header & footer…',
  'Finalising all ' + FORMS_GENERATED.length + ' compliance forms…',
  'Packaging into downloadable ZIP…',
  'Done ✓',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FileDropZone({
  accept, label, hint, icon, slot, onFile, onClear
}: {
  accept: string; label: string; hint: string; icon: string;
  slot: UploadSlot; onFile: (f: File) => void; onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  if (slot.file) {
    return (
      <div className={styles.uploadedSlot}>
        {slot.preview
          ? <img src={slot.preview} alt="preview" className={styles.imgPreview} />
          : <div className={styles.fileChip}>
              <span className={styles.fileChipIcon}>📄</span>
              <div>
                <div className={styles.fileChipName}>{slot.file.name}</div>
                <div className={styles.fileChipSize}>{(slot.file.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
        }
        <button className={styles.clearBtn} onClick={onClear}>✕ Remove</button>
      </div>
    );
  }

  return (
    <div
      className={`${styles.dropZone} ${dragging ? styles.dropZoneOver : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} hidden />
      <div className={styles.dropIcon}>{icon}</div>
      <div className={styles.dropLabel}>{label}</div>
      <div className={styles.dropHint}>{hint}</div>
      <div className={styles.dropCTA}>Click or drag & drop</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentGenerator() {
  const [activeStep, setActiveStep] = useState<StepId>('header');
  const [uploads, setUploads] = useState<Uploads>({
    header: { file: null, preview: null },
    master: { file: null, preview: null },
    footer: { file: null, preview: null },
  });
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [done, setDone] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setFile = (key: keyof Uploads, file: File) => {
    const isImage = file.type.startsWith('image/');
    const preview = isImage ? URL.createObjectURL(file) : null;
    setUploads(prev => ({ ...prev, [key]: { file, preview } }));
  };

  const clearFile = (key: keyof Uploads) => {
    setUploads(prev => {
      if (prev[key].preview) URL.revokeObjectURL(prev[key].preview!);
      return { ...prev, [key]: { file: null, preview: null } };
    });
  };

  const canGenerate =
    uploads.header.file !== null &&
    uploads.master.file !== null &&
    uploads.footer.file !== null;

  // Animate log lines while the real API request is in-flight
  const animateLogs = async (signal: AbortSignal) => {
    for (let i = 0; i < PROCESSING_LOGS.length - 1; i++) {
      if (signal.aborted) return;
      await new Promise(r => setTimeout(r, 550 + Math.random() * 400));
      setLogs(prev => [
        ...prev.map(l => ({ ...l, done: true })),
        { text: PROCESSING_LOGS[i], done: false },
      ]);
    }
  };

  const startProcessing = async () => {
    if (!uploads.header.file || !uploads.master.file || !uploads.footer.file) return;
    setProcessing(true);
    setDone(false);
    setLogs([]);
    setError(null);
    setActiveStep('generate');

    const abortCtrl = new AbortController();

    // kick off log animation in parallel with the real request
    animateLogs(abortCtrl.signal);

    try {
      const body = new FormData();
      body.append('header', uploads.header.file);
      body.append('master', uploads.master.file);
      body.append('footer', uploads.footer.file);

      const res = await fetch('/api/generate-docs', {
        method: 'POST',
        body,
        signal: abortCtrl.signal,
      });

      if (!res.ok) {
        const msg = await res.json().then(d => d.error).catch(() => 'Server error');
        throw new Error(msg);
      }

      // Save ZIP blob for the download button
      const blob = await res.blob();
      setZipBlob(blob);

      abortCtrl.abort(); // stop log animation
      // Final "Done" line
      setLogs(prev => [
        ...prev.map(l => ({ ...l, done: true })),
        { text: PROCESSING_LOGS[PROCESSING_LOGS.length - 1], done: false },
      ]);
      await new Promise(r => setTimeout(r, 500));
      setDone(true);

    } catch (err: unknown) {
      abortCtrl.abort();
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
      setProcessing(false);
    }
  };

  const reset = () => {
    clearFile('header'); clearFile('master'); clearFile('footer');
    setProcessing(false); setLogs([]); setDone(false);
    setZipBlob(null); setError(null);
    setActiveStep('header');
  };

  const handleDownloadZip = () => {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
    a.download = `Regnix_ComplianceForms_${date}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedSteps = (Object.keys(uploads) as (keyof Uploads)[]).filter(k => uploads[k].file);

  return (
    <div className={styles.page}>

      {/* ── Page Title ─────────────────────────────── */}
      <div className={styles.pageHead}>
        <div className={styles.pageHeadLeft}>
          <div className={styles.pageBreadcrumb}>
            <span>Compliance</span><span className={styles.sep}>›</span><span className={styles.active}>Document Generator</span>
          </div>
          <h1 className={styles.pageTitle}>Compliance Form Generator</h1>
          <p className={styles.pageSub}>Upload your master data and branding assets — we generate all statutory forms as PDFs with your header & footer applied.</p>
        </div>
        <div className={styles.statusBadge}>
          <span className={styles.statusDot} />
          {completedSteps.length}/3 assets ready
        </div>
      </div>

      {/* ── Workflow Steps ─────────────────────────── */}
      <div className={styles.stepsRow}>
        {STEPS.map((s, i) => {
          const isUpload = s.id !== 'generate';
          const filled = isUpload && uploads[s.id as keyof Uploads].file !== null;
          const isActive = activeStep === s.id;
          const isDone = (done && s.id === 'generate') || filled;
          return (
            <button
              key={s.id}
              className={`${styles.stepBtn} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''}`}
              onClick={() => setActiveStep(s.id)}
            >
              <div className={styles.stepBadge}>
                {isDone ? '✓' : <span>{s.icon}</span>}
              </div>
              <div className={styles.stepText}>
                <div className={styles.stepLabel}>{s.label}</div>
                <div className={styles.stepSub}>{s.sub}</div>
              </div>
              {i < STEPS.length - 1 && <div className={styles.stepLine} />}
            </button>
          );
        })}
      </div>

      {/* ── Download Manual ────────────────────────── */}
      <div className={styles.downloadBanner}>
        <div className={styles.downloadBannerLeft}>
          <span className={styles.dlIcon}>📥</span>
          <div>
            <strong>Step 0 — Download the Master Template</strong>
            <p>Fill in all employee, contractor, and wage details in the Regnix master Excel file before uploading it below.</p>
          </div>
        </div>
        <a href="/Regnix.xlsx" download className={styles.downloadBtn}>
          <span>⬇</span> Download Master File (.xlsx)
        </a>
      </div>

      {/* ── Main Panel ─────────────────────────────── */}
      <div className={styles.mainPanel}>

        {/* ── LEFT: Upload Panels ─────────────────── */}
        <div className={styles.uploadsCol}>

          {/* HEADER */}
          <div className={`${styles.uploadCard} ${activeStep === 'header' ? styles.uploadCardActive : ''}`}
               onClick={() => setActiveStep('header')}>
            <div className={styles.uploadCardHead}>
              <div className={styles.uploadCardIcon} style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>▤</div>
              <div>
                <div className={styles.uploadCardTitle}>Company Header</div>
                <div className={styles.uploadCardSub}>Logo + letterhead strip (PNG / JPG / SVG)</div>
              </div>
              {uploads.header.file && <span className={styles.checkMark}>✓</span>}
            </div>
            <FileDropZone
              accept="image/*"
              label="Header image"
              hint="Recommended: 2480 × 200 px, transparent PNG"
              icon="🖼"
              slot={uploads.header}
              onFile={f => setFile('header', f)}
              onClear={() => clearFile('header')}
            />
          </div>

          {/* MASTER FILE */}
          <div className={`${styles.uploadCard} ${activeStep === 'master' ? styles.uploadCardActive : ''}`}
               onClick={() => setActiveStep('master')}>
            <div className={styles.uploadCardHead}>
              <div className={styles.uploadCardIcon} style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>⊞</div>
              <div>
                <div className={styles.uploadCardTitle}>Master Data File</div>
                <div className={styles.uploadCardSub}>Filled Regnix .xlsx with all employee & wage data</div>
              </div>
              {uploads.master.file && <span className={styles.checkMark}>✓</span>}
            </div>
            <FileDropZone
              accept=".xlsx,.xls"
              label="Master Excel file"
              hint="Must be the official Regnix template — do not rename columns"
              icon="📊"
              slot={uploads.master}
              onFile={f => setFile('master', f)}
              onClear={() => clearFile('master')}
            />
          </div>

          {/* FOOTER */}
          <div className={`${styles.uploadCard} ${activeStep === 'footer' ? styles.uploadCardActive : ''}`}
               onClick={() => setActiveStep('footer')}>
            <div className={styles.uploadCardHead}>
              <div className={styles.uploadCardIcon} style={{ background: 'rgba(217,119,6,0.1)', color: '#D97706' }}>▤</div>
              <div>
                <div className={styles.uploadCardTitle}>Company Footer</div>
                <div className={styles.uploadCardSub}>Authorized signature strip / footer image (PNG / JPG)</div>
              </div>
              {uploads.footer.file && <span className={styles.checkMark}>✓</span>}
            </div>
            <FileDropZone
              accept="image/*"
              label="Footer image"
              hint="Recommended: 2480 × 150 px, includes signatory block"
              icon="🖼"
              slot={uploads.footer}
              onFile={f => setFile('footer', f)}
              onClear={() => clearFile('footer')}
            />
          </div>

        </div>

        {/* ── RIGHT: Preview + Generate ───────────── */}
        <div className={styles.previewCol}>

          {/* Document Preview Mock */}
          <div className={styles.docPreview}>
            <div className={styles.docPreviewLabel}>Document Preview</div>

            <div className={styles.docMock}>
              {/* Header area */}
              <div className={`${styles.docMockHeader} ${uploads.header.file ? styles.docMockFilled : ''}`}>
                {uploads.header.preview
                  ? <img src={uploads.header.preview} alt="header" className={styles.docMockImg} />
                  : <div className={styles.docMockPlaceholder}>
                      <span className={styles.docMockPlaceholderIcon}>▤</span>
                      <span>Company Header</span>
                    </div>
                }
              </div>

              {/* Body area */}
              <div className={styles.docMockBody}>
                {uploads.master.file ? (
                  <div className={styles.docMockData}>
                    <div className={styles.docMockDataTitle}>✓ Master file ready</div>
                    <div className={styles.docMockDataSub}>{uploads.master.file.name}</div>
                    <div className={styles.docMockLines}>
                      {[90, 75, 85, 60, 80, 70, 55, 88].map((w, i) => (
                        <div key={i} className={styles.docMockLine} style={{ width: `${w}%` }} />
                      ))}
                    </div>
                    <div className={styles.docMockFormList}>
                      {FORMS_GENERATED.slice(0, 5).map((f, i) => (
                        <div key={i} className={styles.docMockFormItem}>
                          <span className={styles.docMockFormDot} />
                          {f}
                        </div>
                      ))}
                      <div className={styles.docMockFormMore}>+ {FORMS_GENERATED.length - 5} more forms</div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.docMockBodyPlaceholder}>
                    <span className={styles.docMockBodyIcon}>⊞</span>
                    <span>Upload master file to preview</span>
                  </div>
                )}
              </div>

              {/* Footer area */}
              <div className={`${styles.docMockFooter} ${uploads.footer.file ? styles.docMockFilled : ''}`}>
                {uploads.footer.preview
                  ? <img src={uploads.footer.preview} alt="footer" className={styles.docMockImg} />
                  : <div className={styles.docMockPlaceholder}>
                      <span className={styles.docMockPlaceholderIcon}>▤</span>
                      <span>Company Footer / Signature</span>
                    </div>
                }
              </div>
            </div>
          </div>

          {/* Forms list */}
          <div className={styles.formsList}>
            <div className={styles.formsListTitle}>Forms to be generated ({FORMS_GENERATED.length})</div>
            {FORMS_GENERATED.map((f, i) => (
              <div key={i} className={styles.formsListItem}>
                <span className={styles.formsListNum}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.formsListName}>{f}</span>
                <span className={styles.formsListBadge}>PDF</span>
              </div>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorIcon}>⚠</span>
              <div>
                <div className={styles.errorTitle}>Generation failed</div>
                <div className={styles.errorMsg}>{error}</div>
              </div>
              <button className={styles.errorRetry} onClick={reset}>Try again</button>
            </div>
          )}

          {/* Generate Button */}
          {!processing && !done && !error && (
            <button
              className={`${styles.generateBtn} ${!canGenerate ? styles.generateBtnDisabled : ''}`}
              disabled={!canGenerate}
              onClick={startProcessing}
            >
              {canGenerate ? '⚡ Generate All Forms' : `⚠ Upload all 3 files to proceed (${completedSteps.length}/3 ready)`}
            </button>
          )}

          {/* Processing State */}
          {processing && !done && (
            <div className={styles.processingBox}>
              <div className={styles.processingHeader}>
                <div className={styles.spinner} />
                <span>Processing your documents…</span>
              </div>
              <div className={styles.logBox}>
                {logs.map((log, i) => (
                  <div key={i} className={`${styles.logLine} ${log.done ? styles.logDone : styles.logActive}`}>
                    <span className={styles.logDot}>{log.done ? '✓' : '›'}</span>
                    {log.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done State */}
          {done && (
            <div className={styles.doneBox}>
              <div className={styles.doneCheck}>✓</div>
              <div className={styles.doneTitle}>All {FORMS_GENERATED.length} forms generated!</div>
              <div className={styles.doneSub}>Your compliance documents are ready with company header and footer applied.</div>
              <div className={styles.doneActions}>
                <button className={styles.downloadAllBtn} onClick={handleDownloadZip}>
                  <span>⬇</span> Download All as ZIP
                </button>
                <button className={styles.startOverBtn} onClick={reset}>
                  Start over
                </button>
              </div>
              <div className={styles.doneFormGrid}>
                {FORMS_GENERATED.map((f, i) => (
                  <div key={i} className={styles.doneFormItem}>
                    <span className={styles.doneFormIcon}>📄</span>
                    <span className={styles.doneFormName}>{f.split('–')[0].trim()}</span>
                    <button className={styles.doneFormDl}>↓</button>
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
