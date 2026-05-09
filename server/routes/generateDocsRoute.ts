/**
 * generateDocsRoute.ts
 * ─────────────────────────────────────────────────────────────
 * Express router — mount this in your main server file:
 *
 *   import generateDocsRouter from './routes/generateDocsRoute';
 *   app.use('/api', generateDocsRouter);
 *
 * Endpoint:  POST /api/generate-docs
 * Auth:      Requires valid JWT (authMiddleware)
 * Body:      multipart/form-data with fields:
 *              header (image)
 *              master (.xlsx)
 *              footer (image)
 *
 * Response:  application/zip  →  all PDF forms in one archive
 *
 * Install:
 *   npm install express multer xlsx pdf-lib jszip
 *   npm install -D @types/multer @types/express
 */

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { generateComplianceDocs } from '../services/documentGeneratorService';

const router = express.Router();

// ─── Multer setup: memory storage, 50 MB cap per file ─────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/png', 'image/jpeg', 'image/jpg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

const uploadFields = upload.fields([
  { name: 'header', maxCount: 1 },
  { name: 'master', maxCount: 1 },
  { name: 'footer', maxCount: 1 },
]);

// ─── POST /api/generate-docs ───────────────────────────────────────────────────

router.post(
  '/generate-docs',
  uploadFields,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

      // Validate all three files are present
      if (!files?.header?.[0] || !files?.master?.[0] || !files?.footer?.[0]) {
        res.status(400).json({
          error: 'Missing required files. Please upload header, master, and footer.',
        });
        return;
      }

      const headerFile = files.header[0];
      const masterFile = files.master[0];
      const footerFile = files.footer[0];

      // Validate master is an xlsx
      const xlsMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (!xlsMimes.includes(masterFile.mimetype)) {
        res.status(400).json({ error: 'Master file must be a .xlsx Excel file.' });
        return;
      }

      // Validate images
      const imgMimes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!imgMimes.includes(headerFile.mimetype) || !imgMimes.includes(footerFile.mimetype)) {
        res.status(400).json({ error: 'Header and footer must be PNG or JPG images.' });
        return;
      }

      // ── Generate ───────────────────────────────────────────────────────────
      const result = await generateComplianceDocs({
        headerFile: headerFile.buffer,
        masterFile: masterFile.buffer,
        footerFile: footerFile.buffer,
        headerMime: headerFile.mimetype,
        footerMime: footerFile.mimetype,
      });

      // ── Stream ZIP back to client ──────────────────────────────────────────
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      res.set({
        'Content-Type':        'application/zip',
        'Content-Disposition': `attachment; filename="Regnix_ComplianceForms_${timestamp}.zip"`,
        'Content-Length':       result.zipBuffer.length,
        'X-Form-Count':         result.formNames.length,
        'X-Row-Count':          result.rowCount,
      });
      res.send(result.zipBuffer);

    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/download-template ───────────────────────────────────────────────
// Serves the master Regnix template file

import path from 'path';
import { existsSync } from 'fs';

router.get('/download-template', (_req: Request, res: Response) => {
  const templatePath = path.join(__dirname, '../../public/Regnix.xlsx');
  if (!existsSync(templatePath)) {
    res.status(404).json({ error: 'Template file not found on server.' });
    return;
  }
  res.download(templatePath, 'Regnix_Master_Template.xlsx');
});

export default router;
