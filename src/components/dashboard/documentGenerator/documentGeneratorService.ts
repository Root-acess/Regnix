/**
 * documentGeneratorService.ts
 * Calls the Python generateRegnixWorkbooks.py script via subprocess.
 * Returns a ZIP containing filled .xlsx statutory forms + payslips.
 *
 * Place generateRegnixWorkbooks.py in one of:
 *   server/scripts/generateRegnixWorkbooks.py   ← recommended
 *   scripts/generateRegnixWorkbooks.py
 *
 * Place template workbooks in one of:
 *   public/templates/   ← recommended
 *   templates/
 */

import { promises as fs } from 'fs';
import path                from 'path';
import os                  from 'os';
import { execFile }        from 'child_process';
import { promisify }       from 'util';

const execFileAsync = promisify(execFile);

export type Binary = ArrayBuffer | Uint8Array | Buffer;

export interface GenerateOptions {
  masterFile:    Binary;
  templatesDir?: string; // override auto-detected templates directory
}

export interface GenerateResult {
  zipBuffer: Uint8Array;
  fileNames: string[];
  rowCount:  number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBuffer(data: Binary): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  const u8 = data as Uint8Array;
  return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
}

/** Resolve path to the Python script, checking multiple candidates. */
function resolveScriptPath(): string {
  const candidates = [
    path.join(process.cwd(), 'server', 'scripts', 'generateRegnixWorkbooks.py'),
    path.join(process.cwd(), 'scripts',            'generateRegnixWorkbooks.py'),
    path.join(__dirname,                            'generateRegnixWorkbooks.py'),
    path.join(__dirname, '..', 'scripts',          'generateRegnixWorkbooks.py'),
    path.join(__dirname, '..',                      'generateRegnixWorkbooks.py'),
  ];
  for (const p of candidates) {
    try {
      if (require('fs').existsSync(p)) return p;
    } catch { /* ignore */ }
  }
  // Return first candidate — will fail at runtime with a clear error
  return candidates[0];
}

/** Resolve templates directory, checking multiple candidates. */
function resolveTemplatesDir(override?: string): string {
  const candidates = override
    ? [override]
    : [
        path.join(process.cwd(), 'public',   'templates'),
        path.join(process.cwd(), 'public',   'template'),
        path.join(process.cwd(),             'templates'),
        path.join(process.cwd(),             'template'),
        path.join(__dirname, '..',           'templates'),
        path.join(__dirname, '..', 'public', 'templates'),
      ];
  for (const p of candidates) {
    try {
      if (require('fs').existsSync(p)) return p;
    } catch { /* ignore */ }
  }
  return candidates[0]; // Python will throw a clear FileNotFoundError
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateComplianceDocs(options: GenerateOptions): Promise<GenerateResult> {
  // Write master file to a temp directory
  const tempDir       = await fs.mkdtemp(path.join(os.tmpdir(), 'regnix-'));
  const masterPath    = path.join(tempDir, 'master.xlsx');
  const outputZipPath = path.join(tempDir, 'regnix-output.zip');

  try {
    await fs.writeFile(masterPath, toBuffer(options.masterFile));

    const scriptPath   = resolveScriptPath();
    const templatesDir = resolveTemplatesDir(options.templatesDir);

    // Verify script exists
    try {
      await fs.access(scriptPath);
    } catch {
      throw new Error(
        `Python script not found at: ${scriptPath}\n` +
        `Place generateRegnixWorkbooks.py in server/scripts/ or scripts/`
      );
    }

    // Verify templates dir exists
    try {
      await fs.access(templatesDir);
    } catch {
      throw new Error(
        `Templates directory not found: ${templatesDir}\n` +
        `Place template .xlsx files in public/templates/\n` +
        `Required: Form_XX_*.xlsx, Form_XXI_*.xlsx, Form_XXII_*.xlsx, Form_XXIII_*.xlsx, Regnix_Payslip_Template.xlsx`
      );
    }

    // Run Python script
    const { stdout, stderr } = await execFileAsync(
      'python3',
      [
        scriptPath,
        '--master',    masterPath,
        '--templates', templatesDir,
        '--output',    outputZipPath,
      ],
      {
        maxBuffer: 20 * 1024 * 1024, // 20 MB stdout buffer
        windowsHide: true,
        timeout: 120_000,            // 2-minute timeout
      },
    );

    if (stderr && stderr.trim()) {
      // Log Python warnings/tracebacks but don't fail on them
      console.warn('[generateRegnixWorkbooks] Python stderr:', stderr.trim());
    }

    // Parse metadata from stdout
    let meta: { fileNames?: string[]; rowCount?: number } = {};
    const trimmed = stdout.trim();
    if (trimmed) {
      try {
        meta = JSON.parse(trimmed);
      } catch {
        console.warn('[generateRegnixWorkbooks] Could not parse stdout JSON:', trimmed);
      }
    }

    // Read the output ZIP
    const zipBuffer = await fs.readFile(outputZipPath);

    return {
      zipBuffer: new Uint8Array(zipBuffer),
      fileNames: Array.isArray(meta.fileNames) ? meta.fileNames : [],
      rowCount:  typeof meta.rowCount === 'number' ? meta.rowCount : 0,
    };

  } finally {
    // Always clean up temp files
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
