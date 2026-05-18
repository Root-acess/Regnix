import fsSync from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';

export type Binary = ArrayBuffer | Uint8Array | Buffer;
type MasterRow = Array<string | number | boolean | null | undefined>;

export interface GenerateOptions {
  masterFile: Binary;
  templatesDir?: string;
}

export interface GenerateResult {
  zipBuffer: Uint8Array;
  fileNames: string[];
  rowCount: number;
}

const TEMPLATE_CANDIDATES = {
  formXX: [
    'Form_XX_Register_of_Deductions_for_Damage_or_Loss.xlsx',
    'Form_XX_Register_of_Deductions_for_Dam.xlsx',
    'Form_XX_Register_of_Deductions_for_Dam_filled.xlsx',
    'Form_XX_Register_of_Deductions_for_Damage_or_Loss_filled.xlsx',
    'Form_XX_Register_of_Deductions_for_Dam(1).xlsx',
  ],
  formXXI: [
    'Form_XXI_Register_of_Fines.xlsx',
    'Form_XXI_Register_of_Fines_filled.xlsx',
    'Form_XXI_Register_of_Fines(1).xlsx',
  ],
  formXXII: [
    'Form_XXII_Register_of_Advances.xlsx',
    'Form_XXII_Register_of_Advances_filled.xlsx',
    'Form_XXII_Register_of_Advances(1).xlsx',
  ],
  formXXIII: [
    'Form_XXIII_Register_of_Overtime.xlsx',
    'Form_XXIII_Register_of_Overtime_filled.xlsx',
    'Form_XXIII_Register_of_Overtime(1).xlsx',
  ],
  payslip: [
    'Payslip_India_Global_v1.xlsx',
    'Payslip_India_Global_v1(1).xlsx',
    'Payslip_RGX-LX-001.xlsx',
    'payslip_template.xlsx',
    'Payslip_Template.xlsx',
  ],
} as const;

function toBuffer(data: Binary): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
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

function firstExisting(baseDir: string, candidates: readonly string[]): string {
  for (const name of candidates) {
    const p = path.join(baseDir, name);
    if (fsSync.existsSync(p)) return p;
  }

  for (const name of candidates) {
    const stem = path.parse(name).name;
    const matches = fsSync.existsSync(baseDir)
      ? fsSync.readdirSync(baseDir).filter((f) => f.startsWith(stem) && f.endsWith('.xlsx'))
      : [];
    if (matches.length > 0) return path.join(baseDir, matches[0]);
  }

  throw new Error(`Could not find any template in ${baseDir}: ${candidates.join(', ')}`);
}


async function readRowsFromWorkbook(masterFile: Binary): Promise<MasterRow[]> {
  const wb = new ExcelJS.Workbook();
  
  // FIXED: Cast to 'any' to safely handle the global Node Buffer vs ExcelJS internal Buffer mismatch
  await wb.xlsx.load(toBuffer(masterFile) as any);

  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Master workbook does not contain a sheet.');

  const rows: MasterRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const values = row.values as Array<string | number | boolean | null | undefined>;
    const rowArr = values.slice(1) as MasterRow; // ExcelJS rows are 1-indexed in values
    if (rowArr.some((cell) => String(cell ?? '').trim() !== '')) {
      rows.push(rowArr);
    }
  });

  return rows;
}

function v(row: MasterRow, idx: number): string {
  const x = row[idx - 1];
  return x === undefined || x === null ? '' : String(x).trim();
}

function pick(row: MasterRow, ...idxs: number[]): string {
  for (const idx of idxs) {
    const text = v(row, idx);
    if (text) return text;
  }
  return '';
}

function num(row: MasterRow, ...idxs: number[]): number {
  for (const idx of idxs) {
    const raw = row[idx - 1];
    if (raw === undefined || raw === null || raw === '') continue;
    const n = Number(String(raw).replace(/[^\d.-]/g, ''));
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function splitName(raw: string): { name: string; father: string } {
  const clean = (raw || '').trim();
  if (!clean) return { name: '', father: '' };
  const parts = clean.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
  return { name: parts[0] || clean, father: parts[1] || '' };
}

function parseDate(text: string): Date | null {
  const val = (text || '').trim();
  if (!val) return null;

  const m = val.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]) - 1;
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    const dt = new Date(y, mo, d);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const parsed = new Date(val);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthYear(text: string): { label: string; dt: Date | null } {
  const dt = parseDate(text);
  if (!dt) return { label: text, dt: null };
  const label = dt.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  return { label, dt };
}

function daysInMonth(dt: Date | null): number {
  if (!dt) return 30;
  return new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
}

function cloneStyle<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function copyRowStyle(ws: ExcelJS.Worksheet, srcRow: number, dstRow: number, cols?: number): void {
  const maxCols = cols ?? ws.columnCount;
  const s = ws.getRow(srcRow);
  const d = ws.getRow(dstRow);

  d.height = s.height;
  d.hidden = s.hidden;

  for (let c = 1; c <= maxCols; c++) {
    const sc = s.getCell(c);
    const dc = d.getCell(c);
    dc.style = cloneStyle(sc.style || {});
  }
}

function setv(ws: ExcelJS.Worksheet, cellRef: string, value: unknown): void {
  ws.getCell(cellRef).value = value as never;
}

async function loadTemplate(templatesDir: string, candidates: readonly string[]): Promise<ExcelJS.Workbook> {
  const filePath = firstExisting(templatesDir, candidates);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  return wb;
}

function getSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
  if (!sheet) throw new Error('Template workbook does not contain a sheet.');
  return sheet;
}

function buildFormXX(workbook: ExcelJS.Workbook, rows: MasterRow[]): ExcelJS.Workbook {
  const ws = getSheet(workbook);
  const first = rows[0] ?? [];

  const contractor = pick(first, 7, 12, 23);
  const licenseNo = pick(first, 13);
  const principal = pick(first, 4);
  const establishment = pick(first, 3).split('\n')[0];
  const principalEst = [principal, establishment].filter(Boolean).join('\n');
  const location = pick(first, 26, 25, 24);

  setv(ws, 'B4', contractor);
  setv(ws, 'H4', licenseNo);
  setv(ws, 'B5', principalEst);
  setv(ws, 'H5', location);

  const limit = Math.min(rows.length, 25);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    const r = 7 + i;
    if (r !== 7) copyRowStyle(ws, 7, r, ws.columnCount);

    const { name } = splitName(pick(row, 90, 32, 300));
    const amountDeduction = pick(row, 107, 368) || (num(row, 107) ? String(Math.trunc(num(row, 107))) : '');
    const amountPerInstall =
      pick(row, 369) ||
      (amountDeduction && num(row, 108) ? (num(row, 107) / num(row, 108)).toFixed(2) : '');

    const remarks = [
      pick(row, 105),
      pick(row, 106),
      pick(row, 111),
      pick(row, 378),
      pick(row, 299),
      pick(row, 334),
    ].filter(Boolean).join(' | ');

    setv(ws, `A${r}`, i + 1);
    setv(ws, `B${r}`, name);
    setv(ws, `C${r}`, pick(row, 217, 34, 216));
    setv(ws, `D${r}`, pick(row, 104, 370));
    setv(ws, `E${r}`, pick(row, 103, 371));
    setv(ws, `F${r}`, pick(row, 368, 107, 103));
    setv(ws, `G${r}`, amountDeduction);
    setv(ws, `H${r}`, pick(row, 108));
    setv(ws, `I${r}`, amountPerInstall);
    setv(ws, `J${r}`, pick(row, 109, 110, 372, 373));
    setv(ws, `K${r}`, remarks);
    setv(ws, `L${r}`, pick(row, 101, 38));
  }

  return workbook;
}

function buildFormXXI(workbook: ExcelJS.Workbook, rows: MasterRow[]): ExcelJS.Workbook {
  const ws = getSheet(workbook);
  const first = rows[0] ?? [];

  const contractor = pick(first, 7, 12, 23);
  const licenseNo = pick(first, 13);
  const principal = pick(first, 4);
  const establishment = pick(first, 3).split('\n')[0];
  const principalEst = [principal, establishment].filter(Boolean).join('\n');
  const location = pick(first, 26, 25, 24);

  setv(ws, 'B4', contractor);
  setv(ws, 'H4', licenseNo);
  setv(ws, 'B5', principalEst);
  setv(ws, 'H5', location);

  const limit = Math.min(rows.length, 25);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    const r = 7 + i;
    if (r !== 7) copyRowStyle(ws, 7, r, ws.columnCount);

    const { name } = splitName(pick(row, 90, 32, 300));
    const remarks = [
      pick(row, 115),
      pick(row, 111),
      pick(row, 299),
      pick(row, 334),
    ].filter(Boolean).join(' | ');

    setv(ws, `A${r}`, i + 1);
    setv(ws, `B${r}`, name);
    setv(ws, `C${r}`, pick(row, 217, 34, 216));
    setv(ws, `D${r}`, pick(row, 370, 104));
    setv(ws, `E${r}`, pick(row, 371, 103));
    setv(ws, `F${r}`, pick(row, 372, 105));
    setv(ws, `G${r}`, pick(row, 373, 106));
    setv(ws, `H${r}`, pick(row, 113, 374));
    setv(ws, `I${r}`, pick(row, 374, 109));
    setv(ws, `J${r}`, pick(row, 114, 375));
    setv(ws, `K${r}`, remarks);
  }

  return workbook;
}

function parseComboDateAmount(text: string): { date: string; amount: string } {
  const val = (text || '').trim();
  if (!val) return { date: '', amount: '' };

  const dateMatch = val.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
  const nums = val.replace(/,/g, '').match(/(?<!\d)(\d+(?:\.\d+)?)/g) || [];
  let amount = '';

  if (nums.length) {
    const vals = nums.map(Number).filter((n) => !Number.isNaN(n));
    if (vals.length) {
      const mx = Math.max(...vals);
      amount = Number.isInteger(mx) ? String(mx) : String(mx);
    }
  }

  return { date: dateMatch?.[1] || '', amount };
}

function buildFormXXII(workbook: ExcelJS.Workbook, rows: MasterRow[]): ExcelJS.Workbook {
  const ws = getSheet(workbook);
  const first = rows[0] ?? [];

  const contractor = pick(first, 7, 12, 23);
  const licenseNo = pick(first, 13);
  const principal = pick(first, 4);
  const establishment = pick(first, 3).split('\n')[0];
  const principalEst = [principal, establishment].filter(Boolean).join('\n');
  const location = pick(first, 26, 25, 24);

  setv(ws, 'B4', contractor);
  setv(ws, 'I4', licenseNo);
  setv(ws, 'B5', principalEst);
  setv(ws, 'I5', location);

  const limit = Math.min(rows.length, 25);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    const r = 7 + i;
    if (r !== 7) copyRowStyle(ws, 7, r, ws.columnCount);

    const { name } = splitName(pick(row, 90, 32, 300));
    const advCombo = parseComboDateAmount(pick(row, 117));
    const instCombo = parseComboDateAmount(pick(row, 120));
    const amountAdv = advCombo.amount || pick(row, 185, 366);
    const amountInst = instCombo.amount || pick(row, 120);

    let balance = '';
    if (amountAdv && pick(row, 185, 366)) {
      const a = Number(String(amountAdv).replace(/[^\d.-]/g, ''));
      const b = Number(String(pick(row, 185, 366)).replace(/[^\d.-]/g, ''));
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        const n = a - b;
        balance = Number.isInteger(n) ? String(n) : String(n);
      }
    }

    setv(ws, `A${r}`, i + 1);
    setv(ws, `B${r}`, name);
    setv(ws, `C${r}`, pick(row, 217, 34, 216));
    setv(ws, `D${r}`, advCombo.date);
    setv(ws, `E${r}`, pick(row, 118, 117));
    setv(ws, `F${r}`, amountAdv);
    setv(ws, `G${r}`, pick(row, 119));
    setv(ws, `H${r}`, amountInst);
    setv(ws, `I${r}`, instCombo.date || pick(row, 121));
    setv(ws, `J${r}`, pick(row, 185, 366));
    setv(ws, `K${r}`, balance || pick(row, 366));
    setv(ws, `L${r}`, pick(row, 101, 38));
    setv(ws, `M${r}`, pick(row, 122, 299, 334));
  }

  return workbook;
}

function buildFormXXIII(workbook: ExcelJS.Workbook, rows: MasterRow[]): ExcelJS.Workbook {
  const ws = getSheet(workbook);
  const first = rows[0] ?? [];

  const contractor = pick(first, 7, 12, 23);
  const licenseNo = pick(first, 13);
  const principal = pick(first, 4);
  const establishment = pick(first, 3).split('\n')[0];
  const principalEst = [principal, establishment].filter(Boolean).join('\n');
  const location = pick(first, 26, 25, 24);
  const monthInfo = monthYear(pick(first, 123, 153, 166, 168, 128));

  setv(ws, 'B4', contractor);
  setv(ws, 'I4', licenseNo);
  setv(ws, 'B5', principalEst);
  setv(ws, 'I5', location);
  setv(ws, 'B6', monthInfo.label);
  setv(ws, 'E6', monthInfo.dt ? monthInfo.dt.getFullYear() : '');
  setv(ws, 'I6', pick(first, 379, 8, 24));

  const limit = Math.min(rows.length, 30);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    const r = 8 + i;
    if (r !== 8) copyRowStyle(ws, 8, r, ws.columnCount);

    const { name } = splitName(pick(row, 90, 32, 300));

    setv(ws, `A${r}`, i + 1);
    setv(ws, `B${r}`, name);
    setv(ws, `C${r}`, pick(row, 217, 34, 216));
    setv(ws, `D${r}`, pick(row, 123, 153));
    setv(ws, `E${r}`, pick(row, 154));
    setv(ws, `F${r}`, pick(row, 377));
    setv(ws, `G${r}`, pick(row, 124));
    setv(ws, `H${r}`, pick(row, 125));
    setv(ws, `I${r}`, pick(row, 126));
    setv(ws, `J${r}`, pick(row, 127));
    setv(ws, `K${r}`, pick(row, 128));
    setv(ws, `L${r}`, pick(row, 101, 38));
    setv(ws, `M${r}`, pick(row, 129, 299, 334));
  }

  return workbook;
}

function buildPayslip(workbook: ExcelJS.Workbook, row: MasterRow, idx: number): ExcelJS.Workbook {
  const ws = workbook.getWorksheet('Payslip') || workbook.worksheets[0];
  if (!ws) throw new Error('Payslip template workbook does not contain a sheet.');

  const estabFull = pick(row, 3);
  const estabName = estabFull ? estabFull.split('\n')[0] : pick(row, 4).split('\n')[0];
  const estabAddr = estabFull && estabFull.includes('\n') ? estabFull.split('\n').slice(1).join('\n') : pick(row, 3);
  const regNo = pick(row, 2);
  const licNo = pick(row, 13);
  const contact = [pick(row, 241), pick(row, 238)].filter(Boolean).join(' | ');

  setv(ws, 'B3', estabName);
  setv(ws, 'B5', estabAddr);
  setv(ws, 'B6', `Registration No: ${regNo}  |  License No: ${licNo}`);
  setv(ws, 'F6', contact);

  const epfReg = pick(row, 146);
  const esicReg = pick(row, 306, 210, 149);
  const ptReg = pick(row, 308, 169, 167);
  const lwfReg = pick(row, 279);
  setv(ws, 'B7', `EPF Reg: ${epfReg}  |  ESIC Reg: ${esicReg}  |  PT: ${ptReg}  |  LWF Reg: ${lwfReg}`);

  const salaryDate = pick(row, 153, 166, 168, 128);
  const monthInfo = monthYear(salaryDate);
  if (monthInfo.dt) {
    const start = `01-${String(monthInfo.dt.getMonth() + 1).padStart(2, '0')}-${monthInfo.dt.getFullYear()}`;
    const endDay = daysInMonth(monthInfo.dt);
    const end = `${String(endDay).padStart(2, '0')}-${String(monthInfo.dt.getMonth() + 1).padStart(2, '0')}-${monthInfo.dt.getFullYear()}`;
    setv(ws, 'E9', `${monthInfo.label}  (${start} to ${end})`);
  } else {
    setv(ws, 'E9', monthInfo.label);
  }
  setv(ws, 'G9', salaryDate);

  const fullName = pick(row, 300, 90, 32);
  const { name: empName } = splitName(fullName);
  const empCode = pick(row, 294, 30, 31, 42) || `EMP_${idx + 1}`;

  setv(ws, 'C12', empName);
  setv(ws, 'G12', empCode);
  setv(ws, 'C13', pick(row, 217, 34, 216));
  setv(ws, 'G13', pick(row, 216));
  setv(ws, 'C14', pick(row, 244, 37));
  setv(ws, 'G14', pick(row, 311, 218));
  setv(ws, 'C15', pick(row, 305, 158));
  const aadhaar = pick(row, 304, 157).replace(/\D/g, '');
  setv(ws, 'G15', aadhaar ? aadhaar.slice(-4).padStart(4, 'X') : '');
  setv(ws, 'C16', pick(row, 146));
  setv(ws, 'G16', pick(row, 306, 210, 149));
  setv(ws, 'C17', pick(row, 152));
  setv(ws, 'G17', pick(row, 266));
  setv(ws, 'C18', pick(row, 267));
  setv(ws, 'G18', pick(row, 265));

  const totalDays = pick(row, 156, 92);
  setv(ws, 'C19', `${totalDays} of ${monthInfo.dt ? daysInMonth(monthInfo.dt) : 30}`);
  setv(ws, 'G19', pick(row, 258));
  setv(ws, 'C20', pick(row, 242));
  setv(ws, 'G20', pick(row, 230, 311));
  setv(ws, 'C21', pick(row, 313, 314, 260));
  setv(ws, 'G21', pick(row, 215, 262));
  setv(ws, 'C22', 'New Tax Regime (Sec 115BAC)');
  setv(ws, 'G22', num(row, 141) ? 'No – Contributing to EPF' : 'Yes – Opted out');

  const monthly = {
    C26: num(row, 94),
    C27: num(row, 95),
    C28: num(row, 131),
    C29: num(row, 137),
    C30: num(row, 132),
    C31: num(row, 139, 140),
    C32: num(row, 135),
    C33: num(row, 138, 269),
    C34: num(row, 96),

    G26: num(row, 141),
    G27: num(row, 151),
    G28: num(row, 133),
    G29: num(row, 163),
    G30: num(row, 332, 331),
    G31: num(row, 185, 366),
    G32: 0,
    G33: 0,
    G34: 0,
  } as const;

  for (const [ref, value] of Object.entries(monthly)) {
    setv(ws, ref, value);
  }

  const earnKeys = ['C26', 'C27', 'C28', 'C29', 'C30', 'C31', 'C32', 'C33', 'C34'] as const;
  const deduKeys = ['G26', 'G27', 'G28', 'G29', 'G30', 'G31', 'G32', 'G33', 'G34'] as const;
  const gross = earnKeys.reduce((sum, k) => sum + monthly[k], 0);
  const deduct = deduKeys.reduce((sum, k) => sum + monthly[k], 0);
  const net = gross - deduct;

  setv(ws, 'C36', gross);
  setv(ws, 'D36', gross * 12);
  setv(ws, 'G36', deduct);
  setv(ws, 'H36', deduct * 12);
  setv(ws, 'F37', net);
  setv(ws, 'H37', 'Monthly');
  setv(ws, 'B38', `Amount in Words:  Rupees ${net.toLocaleString('en-IN')} Only  (Rs. ${net.toLocaleString('en-IN')})`);

  setv(ws, 'C42', num(row, 141));
  setv(ws, 'C43', num(row, 143));
  setv(ws, 'C44', num(row, 144));
  setv(ws, 'C45', num(row, 145));
  setv(ws, 'C46', num(row, 150));
  setv(ws, 'C47', num(row, 162));
  setv(ws, 'C48', num(row, 141) + num(row, 143) + num(row, 144) + num(row, 145) + num(row, 150) + num(row, 162));

  setv(ws, 'B83', `Name: ${empName}`);
  setv(ws, 'C83', `Date: ${salaryDate}`);
  setv(ws, 'F83', `Name: ${pick(row, 298, 297, 220)}`);
  setv(ws, 'G83', `Date: ${salaryDate}`);

  return workbook;
}

export async function generateComplianceDocs(options: GenerateOptions): Promise<GenerateResult> {
  const templatesDir = resolveTemplatesDir(options.templatesDir);
  const rows = await readRowsFromWorkbook(options.masterFile);

  const [xxTpl, xxiTpl, xxiiTpl, xxiiiTpl, payslipTpl] = await Promise.all([
    loadTemplate(templatesDir, TEMPLATE_CANDIDATES.formXX),
    loadTemplate(templatesDir, TEMPLATE_CANDIDATES.formXXI),
    loadTemplate(templatesDir, TEMPLATE_CANDIDATES.formXXII),
    loadTemplate(templatesDir, TEMPLATE_CANDIDATES.formXXIII),
    loadTemplate(templatesDir, TEMPLATE_CANDIDATES.payslip),
  ]);

  const zip = new JSZip();
  const fileNames: string[] = [];

  const outputs: Array<[string, ExcelJS.Workbook]> = [
    ['Form_XX_Register_of_Deductions_for_Damage_or_Loss_filled.xlsx', buildFormXX(xxTpl, rows)],
    ['Form_XXI_Register_of_Fines_filled.xlsx', buildFormXXI(xxiTpl, rows)],
    ['Form_XXII_Register_of_Advances_filled.xlsx', buildFormXXII(xxiiTpl, rows)],
    ['Form_XXIII_Register_of_Overtime_filled.xlsx', buildFormXXIII(xxiiiTpl, rows)],
  ];

  for (const [name, wb] of outputs) {
    const buffer = await wb.xlsx.writeBuffer();
    zip.file(name, Buffer.from(buffer as ArrayBuffer));
    fileNames.push(name);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const empCode = pick(row, 294, 30, 31, 42).trim() || `ROW_${i + 1}`;
    const safeCode = empCode.replace(/[^\w.-]+/g, '_');
    const wb = buildPayslip(payslipTpl, row, i);
    const buffer = await wb.xlsx.writeBuffer();
    const name = `Payslip_${safeCode}.xlsx`;
    zip.file(name, Buffer.from(buffer as ArrayBuffer));
    fileNames.push(name);
  }

  zip.file('manifest.json', JSON.stringify({ rowCount: rows.length, fileNames }, null, 2));

  const zipBuffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });

  return {
    zipBuffer,
    fileNames,
    rowCount: rows.length,
  };
}