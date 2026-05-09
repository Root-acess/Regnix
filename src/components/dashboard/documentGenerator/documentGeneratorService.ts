/**
 * documentGeneratorService.ts
 * ─────────────────────────────────────────────────────────────
 * Backend processing service for the Regnix Document Generator.
 *
 * Workflow:
 *  1. Parse uploaded master .xlsx (155 columns, Regnix format)
 *  2. Map column values to each statutory form's field set
 *  3. Compose each form as a PDF page using pdf-lib
 *  4. Stamp company header image at top + footer image at bottom
 *  5. Return a ZIP blob containing all PDFs
 *
 * Usage (Express route example):
 *
 *   import { generateComplianceDocs } from './documentGeneratorService';
 *
 *   router.post('/api/generate-docs', upload.fields([
 *     { name: 'header', maxCount: 1 },
 *     { name: 'master', maxCount: 1 },
 *     { name: 'footer', maxCount: 1 },
 *   ]), async (req, res) => {
 *     const result = await generateComplianceDocs({
 *       headerFile : req.files['header'][0].buffer,
 *       masterFile : req.files['master'][0].buffer,
 *       footerFile : req.files['footer'][0].buffer,
 *       headerMime : req.files['header'][0].mimetype,
 *       footerMime : req.files['footer'][0].mimetype,
 *     });
 *     res.set('Content-Type', 'application/zip');
 *     res.send(result.zipBuffer);
 *   });
 *
 * Dependencies (add to package.json):
 *   npm install xlsx pdf-lib jszip
 */

import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import JSZip from 'jszip';

// ─── Column index map (matches Regnix.xlsx header row, 0-indexed) ─────────────

const COL = {
  // Workman / employee
  SL_NO:                0,
  REG_NO:               1,
  ESTABLISHMENT_NAME:   2,
  PRINCIPAL_EMPLOYER:   3,
  BUSINESS_TYPE:        4,
  TOTAL_WORKMEN:        5,
  CONTRACTOR_NAME:      6,
  NATURE_OF_WORK:       7,
  MAX_CONTRACT_LABOUR:  8,
  CONTRACT_DURATION:    9,
  REMARKS_GEN:          10,
  CONTRACTOR_ADDRESS:   11,
  LICENCE_NO:           12,
  LICENCE_EXPIRY:       13,
  LICENCE_REVOKED:      14,
  SECURITY_DD_PREV:     15,
  SECURITY_AMT_PREV:    16,
  SECURITY_DD_BALANCE:  17,
  REG_CERT_NO:          18,
  PRINCIPAL_EMPLOYER_2: 19,
  FRESH_CONTRACT:       20,
  CERT_REG_NO:          21,
  PRINCIPAL_EMPLOYER_3: 22,
  CONTRACTOR_ADDR_2:    23,
  NATURE_WORK_2:        24,
  ESTABLISHMENT_ADDR:   25,
  NATURE_WORK_3:        26,
  CONTRACT_LOCATION:    27,
  CONTRACT_FROM:        28,
  CONTRACT_TO:          29,
  MAX_WORKMEN:          30,
  EMP_CODE:             31,
  WORKMAN_SL:           32,
  WORKMAN_NAME:         33,
  AGE_SEX:              34,
  DESIGNATION:          35,
  HOME_ADDRESS:         36,
  LOCAL_ADDRESS:        37,
  DATE_COMMENCE:        38,
  SIGNATURE:            39,
  DATE_TERMINATION:     40,
  REASON_TERMINATION:   41,
  TERMINATION_REMARKS:  42,
  SERIAL_REGISTER:      43,
  EMPLOYMENT_NATURE:    44,
  WAGE_RATE:            45,
  TENURE:               46,
  EMP_CARD_REMARKS:     47,
  IDENTIFICATION:       48,
  EMPLOYED_FROM:        49,
  EMPLOYED_TO:          50,
  NATURE_WORK_DONE:     51,
  RATE_OF_WAGE:         52,
  FORM_XV_REMARK:       53,
  // Muster Roll (Form XVI) — columns 54–84 are dates 1–31
  MUSTER_START:         54,
  MUSTER_END:           84,
  FORM_XVI_REMARK:      85,
  // Wages (Form XVII)
  WORKMAN_NAME_XVII:    86,
  SERIAL_REGISTER_XVII: 87,
  DAYS_WORKED:          88,
  DAILY_RATE:           89,
  BASIC_WAGES:          90,
  DA:                   91,
  HRA:                  136,
  MEDICAL_ALLOW:        137,
  PT:                   138,
  LWF:                  139,
  LEAVE_ENCASH:         140,
  NFH:                  141,
  CONVEYANCE:           142,
  STATUTORY_BONUS:      143,
  OVERTIME:             92,
  OTHER_CASH:           93,
  WAGES_TOTAL:          94,
  DEDUCTIONS:           95,
  NET_PAYMENT:          96,
  WORKMAN_SIGN:         97,
  // Form XX – Deductions
  DAMAGE_PARTICULARS:   98,
  DAMAGE_DATE:          99,
  CAUSE_SHOWN:          100,
  WITNESS:              101,
  DEDUCTION_AMOUNT:     102,
  INSTALLMENTS_NO:      103,
  RECOVERY_FIRST:       104,
  RECOVERY_LAST:        105,
  FORM_XX_REMARK:       106,
  // Form XXI – Fines
  FINE_WAGE_PERIOD:     107,
  FINE_AMOUNT:          108,
  FINE_REALIZED_DATE:   109,
  FORM_XXI_REMARK:      110,
  // Form XXII – Advances
  ADV_WAGE_PERIOD:      111,
  ADV_DATE_AMOUNT:      112,
  ADV_PURPOSE:          113,
  ADV_INSTALLMENTS:     114,
  ADV_REPAY_DATE:       115,
  ADV_LAST_INSTALMENT:  116,
  FORM_XXII_REMARK:     117,
  // Form XXIII – Overtime
  OT_DATE:              118,
  OT_TOTAL:             119,
  OT_NORMAL_RATE:       120,
  OT_RATE:              121,
  OT_EARNINGS:          122,
  OT_PAID_DATE:         123,
  FORM_XXIII_REMARK:    124,
  // Salary components
  OTHER_ALLOWANCE:      144,
  ADDITIONAL_COMP:      145,
  EMPLOYER_PF:          146,
  EMPLOYEE_PF:          147,
  EMPLOYER_EPS:         148,
  EMPLOYER_EDLI:        149,
  PF_ADMIN:             150,
  UAN:                  151,
  ESIC_IP:              152,
  ESIC_EMPLOYER:        153,
  ESIC_EMPLOYEE:        154,
  // Misc
  BANK_NAME:            125,
  SALARY_DATE:          126,
  WORKING_HOURS:        129,
  TOTAL_DAYS:           133,
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GenerateOptions {
  headerFile: Buffer;      // raw bytes of header image (PNG/JPG)
  masterFile: Buffer;      // raw bytes of .xlsx
  footerFile: Buffer;      // raw bytes of footer image (PNG/JPG)
  headerMime: string;      // 'image/png' | 'image/jpeg'
  footerMime: string;
}

export interface GenerateResult {
  zipBuffer: Buffer;
  formNames: string[];
  rowCount: number;
}

export interface WorkerRow {
  [key: string]: string | number | undefined;
}

// ─── Helper: parse value ───────────────────────────────────────────────────────

function val(row: WorkerRow, colIndex: number): string {
  const v = row[colIndex];
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

// ─── Page layout constants ─────────────────────────────────────────────────────

const PAGE_W   = 841.89; // A4 landscape width  (pts)
const PAGE_H   = 595.28; // A4 landscape height
const MARGIN   = 36;
const HEADER_H = 70;     // reserved height for header image
const FOOTER_H = 50;     // reserved height for footer image
const BODY_TOP = PAGE_H - MARGIN - HEADER_H;
const BODY_BOT = MARGIN + FOOTER_H;

// ─── Stamp header & footer onto a PDF page ─────────────────────────────────────

async function stampBranding(
  page: PDFPage,
  pdfDoc: PDFDocument,
  headerBytes: Buffer,
  footerBytes: Buffer,
  headerMime: string,
  footerMime: string,
) {
  const embedImage = async (bytes: Buffer, mime: string) =>
    mime === 'image/png'
      ? pdfDoc.embedPng(bytes)
      : pdfDoc.embedJpg(bytes);

  const headerImg = await embedImage(headerBytes, headerMime);
  const footerImg = await embedImage(footerBytes, footerMime);

  // Header strip — full width at top
  page.drawImage(headerImg, {
    x: MARGIN,
    y: PAGE_H - MARGIN - HEADER_H,
    width: PAGE_W - MARGIN * 2,
    height: HEADER_H,
  });

  // Footer strip — full width at bottom
  page.drawImage(footerImg, {
    x: MARGIN,
    y: MARGIN,
    width: PAGE_W - MARGIN * 2,
    height: FOOTER_H,
  });
}

// ─── Draw a simple label:value table ──────────────────────────────────────────

function drawTable(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  title: string,
  fields: { label: string; value: string }[][],
  startY: number,
  colCount = 3,
) {
  const lineH   = 18;
  const cellW   = (PAGE_W - MARGIN * 2) / colCount;
  let y = startY;

  // Form title
  page.drawText(title, {
    x: MARGIN,
    y,
    size: 11,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.3),
  });
  y -= lineH * 1.4;

  // Draw border line under title
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.8),
  });
  y -= lineH * 0.6;

  for (const row of fields) {
    if (y < BODY_BOT + lineH) break; // stop before footer
    let x = MARGIN;
    for (const cell of row) {
      if (cell.label) {
        page.drawText(cell.label + ':', {
          x,
          y,
          size: 7,
          font,
          color: rgb(0.5, 0.5, 0.6),
        });
        page.drawText(cell.value || '—', {
          x,
          y: y - 9,
          size: 8.5,
          font: boldFont,
          color: rgb(0.1, 0.1, 0.2),
          maxWidth: cellW - 8,
        });
      }
      x += cellW;
    }
    y -= lineH * 1.6;
  }

  return y; // return remaining Y for chaining
}

// ─── Generate Form XIII – Register of Workmen ─────────────────────────────────

async function buildFormXIII(
  rows: WorkerRow[],
  pdfDoc: PDFDocument,
  headerBytes: Buffer, footerBytes: Buffer,
  headerMime: string, footerMime: string,
  font: PDFFont, bold: PDFFont,
): Promise<void> {
  for (const row of rows) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    await stampBranding(page, pdfDoc, headerBytes, footerBytes, headerMime, footerMime);

    const fields: { label: string; value: string }[][] = [
      [
        { label: 'Sl. No',                value: val(row, COL.SL_NO) },
        { label: 'Workman Name',           value: val(row, COL.WORKMAN_NAME) },
        { label: 'Age & Sex',              value: val(row, COL.AGE_SEX) },
      ],
      [
        { label: 'Father / Husband Name', value: val(row, COL.WORKMAN_NAME) },
        { label: 'Designation',           value: val(row, COL.DESIGNATION) },
        { label: 'Employee Code',         value: val(row, COL.EMP_CODE) },
      ],
      [
        { label: 'Permanent Address',     value: val(row, COL.HOME_ADDRESS) },
        { label: 'Local Address',         value: val(row, COL.LOCAL_ADDRESS) },
        { label: 'Identification Marks',  value: val(row, COL.IDENTIFICATION) },
      ],
      [
        { label: 'Date of Commencement',  value: val(row, COL.DATE_COMMENCE) },
        { label: 'Date of Termination',   value: val(row, COL.DATE_TERMINATION) },
        { label: 'Reason for Termination',value: val(row, COL.REASON_TERMINATION) },
      ],
      [
        { label: 'Contractor',            value: val(row, COL.CONTRACTOR_NAME) },
        { label: 'Establishment',         value: val(row, COL.ESTABLISHMENT_NAME) },
        { label: 'Principal Employer',    value: val(row, COL.PRINCIPAL_EMPLOYER) },
      ],
      [
        { label: 'Nature of Work',        value: val(row, COL.NATURE_OF_WORK) },
        { label: 'Wage Rate',             value: val(row, COL.WAGE_RATE) },
        { label: 'Remarks',              value: val(row, COL.TERMINATION_REMARKS) },
      ],
    ];

    drawTable(page, font, bold, 'FORM XIII — Register of Workmen Employed by Contractor [Rule 75]', fields, BODY_TOP - 10);
  }
}

// ─── Generate Form XIV – Employment Card ──────────────────────────────────────

async function buildFormXIV(
  rows: WorkerRow[],
  pdfDoc: PDFDocument,
  headerBytes: Buffer, footerBytes: Buffer,
  headerMime: string, footerMime: string,
  font: PDFFont, bold: PDFFont,
): Promise<void> {
  for (const row of rows) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    await stampBranding(page, pdfDoc, headerBytes, footerBytes, headerMime, footerMime);

    const fields: { label: string; value: string }[][] = [
      [
        { label: 'Name of Workman',       value: val(row, COL.WORKMAN_NAME) },
        { label: 'Sl. No in Register',    value: val(row, COL.SERIAL_REGISTER) },
        { label: 'Nature of Employment',  value: val(row, COL.EMPLOYMENT_NATURE) },
      ],
      [
        { label: 'Wage Rate / Unit',      value: val(row, COL.WAGE_RATE) },
        { label: 'Tenure of Employment',  value: val(row, COL.TENURE) },
        { label: 'Remarks',              value: val(row, COL.EMP_CARD_REMARKS) },
      ],
    ];

    drawTable(page, font, bold, 'FORM XIV — Employment Card [Rule 76]', fields, BODY_TOP - 10);
  }
}

// ─── Generate Form XV – Service Certificate ───────────────────────────────────

async function buildFormXV(
  rows: WorkerRow[],
  pdfDoc: PDFDocument,
  headerBytes: Buffer, footerBytes: Buffer,
  headerMime: string, footerMime: string,
  font: PDFFont, bold: PDFFont,
): Promise<void> {
  for (const row of rows) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    await stampBranding(page, pdfDoc, headerBytes, footerBytes, headerMime, footerMime);

    const fields: { label: string; value: string }[][] = [
      [
        { label: 'Name of Workman',        value: val(row, COL.WORKMAN_NAME) },
        { label: 'Total Period From',      value: val(row, COL.EMPLOYED_FROM) },
        { label: 'Total Period To',        value: val(row, COL.EMPLOYED_TO) },
      ],
      [
        { label: 'Nature of Work Done',    value: val(row, COL.NATURE_WORK_DONE) },
        { label: 'Rate of Wage',          value: val(row, COL.RATE_OF_WAGE) },
        { label: 'Remarks',              value: val(row, COL.FORM_XV_REMARK) },
      ],
    ];

    drawTable(page, font, bold, 'FORM XV — Service Certificate [Rule 77]', fields, BODY_TOP - 10);
  }
}

// ─── Generate Form XVI – Muster Roll ──────────────────────────────────────────

async function buildFormXVI(
  rows: WorkerRow[],
  pdfDoc: PDFDocument,
  headerBytes: Buffer, footerBytes: Buffer,
  headerMime: string, footerMime: string,
  font: PDFFont, bold: PDFFont,
): Promise<void> {
  for (const row of rows) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    await stampBranding(page, pdfDoc, headerBytes, footerBytes, headerMime, footerMime);

    // Build daily attendance row
    const dayFields: { label: string; value: string }[] = [];
    for (let d = 1; d <= 31; d++) {
      dayFields.push({ label: `Day ${d}`, value: val(row, COL.MUSTER_START + d - 1) });
    }

    // chunk into rows of 8
    const chunked: { label: string; value: string }[][] = [];
    for (let i = 0; i < dayFields.length; i += 8) {
      chunked.push(dayFields.slice(i, i + 8));
    }

    const headerFields: { label: string; value: string }[][] = [
      [
        { label: 'Name of Workman',  value: val(row, COL.WORKMAN_NAME) },
        { label: 'Serial No',        value: val(row, COL.WORKMAN_SL) },
        { label: 'Remarks',         value: val(row, COL.FORM_XVI_REMARK) },
      ],
      ...chunked,
    ];

    drawTable(page, font, bold, 'FORM XVI — Muster Roll [Rule 78(1)(a)(i)]', headerFields, BODY_TOP - 10, 8);
  }
}

// ─── Generate Form XVII – Register of Wages ───────────────────────────────────

async function buildFormXVII(
  rows: WorkerRow[],
  pdfDoc: PDFDocument,
  headerBytes: Buffer, footerBytes: Buffer,
  headerMime: string, footerMime: string,
  font: PDFFont, bold: PDFFont,
): Promise<void> {
  for (const row of rows) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    await stampBranding(page, pdfDoc, headerBytes, footerBytes, headerMime, footerMime);

    const fields: { label: string; value: string }[][] = [
      [
        { label: 'Name of Workman',      value: val(row, COL.WORKMAN_NAME_XVII) },
        { label: 'Serial No. (Register)',value: val(row, COL.SERIAL_REGISTER_XVII) },
        { label: 'Days Worked',          value: val(row, COL.DAYS_WORKED) },
      ],
      [
        { label: 'Daily Rate / Piece Rate', value: val(row, COL.DAILY_RATE) },
        { label: 'Basic Wages',          value: val(row, COL.BASIC_WAGES) },
        { label: 'D.A.',                 value: val(row, COL.DA) },
      ],
      [
        { label: 'H.R.A.',               value: val(row, COL.HRA) },
        { label: 'Medical Allowance',    value: val(row, COL.MEDICAL_ALLOW) },
        { label: 'Conveyance',           value: val(row, COL.CONVEYANCE) },
      ],
      [
        { label: 'Overtime',             value: val(row, COL.OVERTIME) },
        { label: 'Other Cash Payments',  value: val(row, COL.OTHER_CASH) },
        { label: 'Statutory Bonus',      value: val(row, COL.STATUTORY_BONUS) },
      ],
      [
        { label: 'Leave Encashment',     value: val(row, COL.LEAVE_ENCASH) },
        { label: 'NFH Allowance',        value: val(row, COL.NFH) },
        { label: 'Other Allowance',      value: val(row, COL.OTHER_ALLOWANCE) },
      ],
      [
        { label: 'Gross Total',          value: val(row, COL.WAGES_TOTAL) },
        { label: 'Deductions',           value: val(row, COL.DEDUCTIONS) },
        { label: 'Net Payment',          value: val(row, COL.NET_PAYMENT) },
      ],
      [
        { label: 'P.T.',                 value: val(row, COL.PT) },
        { label: 'L.W.F.',               value: val(row, COL.LWF) },
        { label: 'Workman Signature',    value: val(row, COL.WORKMAN_SIGN) },
      ],
    ];

    drawTable(page, font, bold, 'FORM XVII — Register of Wages [Rule 78(1)(a)(i)]', fields, BODY_TOP - 10);
  }
}

// ─── Generate Form XX – Register of Deductions ────────────────────────────────

async function buildFormXX(
  rows: WorkerRow[],
  pdfDoc: PDFDocument,
  headerBytes: Buffer, footerBytes: Buffer,
  headerMime: string, footerMime: string,
  font: PDFFont, bold: PDFFont,
): Promise<void> {
  for (const row of rows) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    await stampBranding(page, pdfDoc, headerBytes, footerBytes, headerMime, footerMime);

    const fields: { label: string; value: string }[][] = [
      [
        { label: 'Particulars of Damage/Loss', value: val(row, COL.DAMAGE_PARTICULARS) },
        { label: 'Date of Damage/Loss',        value: val(row, COL.DAMAGE_DATE) },
        { label: 'Cause Shown?',               value: val(row, COL.CAUSE_SHOWN) },
      ],
      [
        { label: 'Witness Present',     value: val(row, COL.WITNESS) },
        { label: 'Amount of Deduction', value: val(row, COL.DEDUCTION_AMOUNT) },
        { label: 'No. of Instalments',  value: val(row, COL.INSTALLMENTS_NO) },
      ],
      [
        { label: 'First Recovery Date', value: val(row, COL.RECOVERY_FIRST) },
        { label: 'Last Recovery Date',  value: val(row, COL.RECOVERY_LAST) },
        { label: 'Remarks',            value: val(row, COL.FORM_XX_REMARK) },
      ],
    ];

    drawTable(page, font, bold, 'FORM XX — Register of Deductions for Damage or Loss [Rule 78(1)(a)(i)]', fields, BODY_TOP - 10);
  }
}

// ─── Generate Form XXI – Register of Fines ────────────────────────────────────

async function buildFormXXI(
  rows: WorkerRow[],
  pdfDoc: PDFDocument,
  headerBytes: Buffer, footerBytes: Buffer,
  headerMime: string, footerMime: string,
  font: PDFFont, bold: PDFFont,
): Promise<void> {
  for (const row of rows) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    await stampBranding(page, pdfDoc, headerBytes, footerBytes, headerMime, footerMime);

    const fields: { label: string; value: string }[][] = [
      [
        { label: 'Wage Period & Wages Payable', value: val(row, COL.FINE_WAGE_PERIOD) },
        { label: 'Amount of Fine Imposed',      value: val(row, COL.FINE_AMOUNT) },
        { label: 'Date Fine Realised',          value: val(row, COL.FINE_REALIZED_DATE) },
      ],
      [
        { label: 'Remarks', value: val(row, COL.FORM_XXI_REMARK) },
        { label: '', value: '' },
        { label: '', value: '' },
      ],
    ];

    drawTable(page, font, bold, 'FORM XXI — Register of Fines [Rule 78(1)(a)(ii)]', fields, BODY_TOP - 10);
  }
}

// ─── Generate Form XXII – Register of Advances ────────────────────────────────

async function buildFormXXII(
  rows: WorkerRow[],
  pdfDoc: PDFDocument,
  headerBytes: Buffer, footerBytes: Buffer,
  headerMime: string, footerMime: string,
  font: PDFFont, bold: PDFFont,
): Promise<void> {
  for (const row of rows) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    await stampBranding(page, pdfDoc, headerBytes, footerBytes, headerMime, footerMime);

    const fields: { label: string; value: string }[][] = [
      [
        { label: 'Wage Period',         value: val(row, COL.ADV_WAGE_PERIOD) },
        { label: 'Date & Amount Given', value: val(row, COL.ADV_DATE_AMOUNT) },
        { label: 'Purpose',            value: val(row, COL.ADV_PURPOSE) },
      ],
      [
        { label: 'No. of Instalments',   value: val(row, COL.ADV_INSTALLMENTS) },
        { label: 'Repayment Date',       value: val(row, COL.ADV_REPAY_DATE) },
        { label: 'Last Instalment Date', value: val(row, COL.ADV_LAST_INSTALMENT) },
      ],
      [
        { label: 'Remarks', value: val(row, COL.FORM_XXII_REMARK) },
        { label: '', value: '' },
        { label: '', value: '' },
      ],
    ];

    drawTable(page, font, bold, 'FORM XXII — Register of Advances [Rule 78(1)(a)(ii)]', fields, BODY_TOP - 10);
  }
}

// ─── Generate Form XXIII – Register of Overtime ───────────────────────────────

async function buildFormXXIII(
  rows: WorkerRow[],
  pdfDoc: PDFDocument,
  headerBytes: Buffer, footerBytes: Buffer,
  headerMime: string, footerMime: string,
  font: PDFFont, bold: PDFFont,
): Promise<void> {
  for (const row of rows) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    await stampBranding(page, pdfDoc, headerBytes, footerBytes, headerMime, footerMime);

    const fields: { label: string; value: string }[][] = [
      [
        { label: 'Date OT Worked',     value: val(row, COL.OT_DATE) },
        { label: 'Total OT Hours',     value: val(row, COL.OT_TOTAL) },
        { label: 'Normal Wage Rate',   value: val(row, COL.OT_NORMAL_RATE) },
      ],
      [
        { label: 'OT Wage Rate',       value: val(row, COL.OT_RATE) },
        { label: 'OT Earnings',        value: val(row, COL.OT_EARNINGS) },
        { label: 'OT Wages Paid Date', value: val(row, COL.OT_PAID_DATE) },
      ],
      [
        { label: 'Remarks', value: val(row, COL.FORM_XXIII_REMARK) },
        { label: '', value: '' },
        { label: '', value: '' },
      ],
    ];

    drawTable(page, font, bold, 'FORM XXIII — Register of Overtime [Rule 78(1)(a)(iii)]', fields, BODY_TOP - 10);
  }
}

// ─── Generate PF / ESIC Summary ───────────────────────────────────────────────

async function buildPFESICSummary(
  rows: WorkerRow[],
  pdfDoc: PDFDocument,
  headerBytes: Buffer, footerBytes: Buffer,
  headerMime: string, footerMime: string,
  font: PDFFont, bold: PDFFont,
): Promise<void> {
  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  await stampBranding(page, pdfDoc, headerBytes, footerBytes, headerMime, footerMime);

  const allFields: { label: string; value: string }[][] = [];

  for (const row of rows) {
    allFields.push([
      { label: 'Employee',        value: val(row, COL.WORKMAN_NAME) },
      { label: 'UAN',             value: val(row, COL.UAN) },
      { label: 'Basic Wages',     value: val(row, COL.BASIC_WAGES) },
    ]);
    allFields.push([
      { label: 'Employer PF',     value: val(row, COL.EMPLOYER_PF) },
      { label: 'Employee PF',     value: val(row, COL.EMPLOYEE_PF) },
      { label: 'Employer EPS',    value: val(row, COL.EMPLOYER_EPS) },
    ]);
    allFields.push([
      { label: 'EDLI',            value: val(row, COL.EMPLOYER_EDLI) },
      { label: 'PF Admin Charges',value: val(row, COL.PF_ADMIN) },
      { label: 'ESIC IP No.',     value: val(row, COL.ESIC_IP) },
    ]);
    allFields.push([
      { label: 'ESIC Employer',   value: val(row, COL.ESIC_EMPLOYER) },
      { label: 'ESIC Employee',   value: val(row, COL.ESIC_EMPLOYEE) },
      { label: 'Bank Name',       value: val(row, COL.BANK_NAME) },
    ]);
    // spacer row
    allFields.push([
      { label: '', value: '' }, { label: '', value: '' }, { label: '', value: '' },
    ]);
  }

  drawTable(page, font, bold, 'PF / ESIC Summary Register', allFields, BODY_TOP - 10);
}

// ─── Master export function ────────────────────────────────────────────────────

export async function generateComplianceDocs(opts: GenerateOptions): Promise<GenerateResult> {
  const { headerFile, masterFile, footerFile, headerMime, footerMime } = opts;

  // 1 ─ Parse Excel
  const workbook = XLSX.read(masterFile, { type: 'buffer', cellDates: true });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const raw      = XLSX.utils.sheet_to_json<WorkerRow>(sheet, { header: 1, defval: '' });

  // Row 0 is the column header, data starts at row 1
  const dataRows = (raw as WorkerRow[]).slice(1).filter(r => r[COL.WORKMAN_NAME]);
  const rowCount = dataRows.length;

  const zip  = new JSZip();
  const formNames: string[] = [];

  // Helper to create a new PDF and load fonts
  const newPDF = async () => {
    const doc  = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    return { doc, font, bold };
  };

  const addToZip = async (
    name: string,
    builder: (d: PDFDocument, f: PDFFont, b: PDFFont) => Promise<void>,
  ) => {
    const { doc, font, bold } = await newPDF();
    await builder(doc, font, bold);
    const pdfBytes = await doc.save();
    zip.file(`${name}.pdf`, pdfBytes);
    formNames.push(name);
  };

  // 2 ─ Generate each form
  await addToZip('Form_XIII_Register_of_Workmen', (doc, f, b) =>
    buildFormXIII(dataRows, doc, headerFile, footerFile, headerMime, footerMime, f, b));

  await addToZip('Form_XIV_Employment_Card', (doc, f, b) =>
    buildFormXIV(dataRows, doc, headerFile, footerFile, headerMime, footerMime, f, b));

  await addToZip('Form_XV_Service_Certificate', (doc, f, b) =>
    buildFormXV(dataRows, doc, headerFile, footerFile, headerMime, footerMime, f, b));

  await addToZip('Form_XVI_Muster_Roll', (doc, f, b) =>
    buildFormXVI(dataRows, doc, headerFile, footerFile, headerMime, footerMime, f, b));

  await addToZip('Form_XVII_Register_of_Wages', (doc, f, b) =>
    buildFormXVII(dataRows, doc, headerFile, footerFile, headerMime, footerMime, f, b));

  await addToZip('Form_XX_Register_of_Deductions', (doc, f, b) =>
    buildFormXX(dataRows, doc, headerFile, footerFile, headerMime, footerMime, f, b));

  await addToZip('Form_XXI_Register_of_Fines', (doc, f, b) =>
    buildFormXXI(dataRows, doc, headerFile, footerFile, headerMime, footerMime, f, b));

  await addToZip('Form_XXII_Register_of_Advances', (doc, f, b) =>
    buildFormXXII(dataRows, doc, headerFile, footerFile, headerMime, footerMime, f, b));

  await addToZip('Form_XXIII_Register_of_Overtime', (doc, f, b) =>
    buildFormXXIII(dataRows, doc, headerFile, footerFile, headerMime, footerMime, f, b));

  await addToZip('PF_ESIC_Summary', (doc, f, b) =>
    buildPFESICSummary(dataRows, doc, headerFile, footerFile, headerMime, footerMime, f, b));

  // 3 ─ Package ZIP
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  return { zipBuffer, formNames, rowCount };
}
