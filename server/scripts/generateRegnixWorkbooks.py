import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type Binary = ArrayBuffer | Uint8Array | Buffer;

export interface GenerateOptions {
  masterFile: Binary;
  templatesDir?: string;
}

export interface GenerateResult {
  zipBuffer: Uint8Array;
  fileNames: string[];
  rowCount: number;
}

function toBuffer(data: Binary): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  const u8 = data as Uint8Array;
  return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
}

function resolvePythonCmd(): string {
  const candidates = [
    path.join(process.cwd(), '.venv', 'bin', 'python'),
    path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'),
    'python3',
    'python',
  ];

  for (const candidate of candidates) {
    if (candidate === 'python3' || candidate === 'python') return candidate;
    if (fsSync.existsSync(candidate)) return candidate;
  }

  return 'python3';
}

function resolveScriptPath(): string {
  const candidates = [
    path.join(process.cwd(), 'server', 'scripts', 'generateRegnixWorkbooks.py'),
    path.join(process.cwd(), 'server', 'script', 'generateRegnixworkbook.py'),
    path.join(process.cwd(), 'server', 'script', 'generateRegnixWorkbooks.py'),
    path.join(process.cwd(), 'scripts', 'generateRegnixWorkbooks.py'),
    path.join(process.cwd(), 'scripts', 'generateRagnixworkbook.py'),
  ];

  for (const p of candidates) {
    if (fsSync.existsSync(p)) return p;
  }

  return candidates[0];
}

function resolveTemplatesDir(override?: string): string {
  const candidates = override
    ? [override]
    : [
        path.join(process.cwd(), 'public', 'templates'),
        path.join(process.cwd(), 'public', 'template'),
        path.join(process.cwd(), 'templates'),
        path.join(process.cwd(), 'template'),
      ];

  for (const p of candidates) {
    if (fsSync.existsSync(p)) return p;
  }

  return candidates[0];
}

export async function generateComplianceDocs(options: GenerateOptions): Promise<GenerateResult> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'regnix-'));
  const masterPath = path.join(tempDir, 'master.xlsx');
  const outputZipPath = path.join(tempDir, 'regnix-output.zip');

  try {
    await fs.writeFile(masterPath, toBuffer(options.masterFile));

    const scriptPath = resolveScriptPath();
    const templatesDir = resolveTemplatesDir(options.templatesDir);
    const pythonCmd = resolvePythonCmd();

    if (!fsSync.existsSync(scriptPath)) {
      throw new Error(
        `Python script not found.\nExpected one of:\n` +
          `- server/scripts/generateRegnixWorkbooks.py\n` +
          `- server/script/generateRegnixworkbook.py\n` +
          `- scripts/generateRegnixWorkbooks.py`
      );
    }

    if (!fsSync.existsSync(templatesDir)) {
      throw new Error(
        `Templates directory not found.\nExpected one of:\n` +
          `- public/templates\n- public/template\n- templates\n- template`
      );
    }

    const { stdout, stderr } = await execFileAsync(
      pythonCmd,
      [
        scriptPath,
        '--master',
        masterPath,
        '--templates',
        templatesDir,
        '--output',
        outputZipPath,
      ],
      {
        maxBuffer: 20 * 1024 * 1024,
        windowsHide: true,
        timeout: 120_000,
      },
    );

    if (stderr && stderr.trim()) {
      console.warn('[generateRegnixWorkbooks] Python stderr:', stderr.trim());
    }

    let meta: { fileNames?: string[]; rowCount?: number } = {};
    const trimmed = stdout.trim();

    if (trimmed) {
      try {
        meta = JSON.parse(trimmed);
      } catch {
        console.warn('[generateRegnixWorkbooks] Could not parse stdout JSON:', trimmed);
      }
    }

    const zipBuffer = await fs.readFile(outputZipPath);

    return {
      zipBuffer: new Uint8Array(zipBuffer),
      fileNames: Array.isArray(meta.fileNames) ? meta.fileNames : [],
      rowCount: typeof meta.rowCount === 'number' ? meta.rowCount : 0,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}