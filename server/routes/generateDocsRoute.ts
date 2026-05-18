import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateComplianceDocs } from '../services/documentGeneratorService';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

const uploadFields = upload.fields([
  { name: 'master', maxCount: 1 },
  { name: 'header', maxCount: 1 },
  { name: 'footer', maxCount: 1 },
]);

router.post(
  '/generate-docs',
  uploadFields,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;

      if (!files?.master?.[0]) {
        res.status(400).json({
          error: 'Master workbook is required. Upload your filled RegnixMain.xlsx.',
        });
        return;
      }

      const masterFile = files.master[0];

      const allowedXls = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];

      if (!allowedXls.includes(masterFile.mimetype)) {
        res.status(400).json({
          error: 'Master file must be an .xlsx Excel workbook.',
        });
        return;
      }

      const templatesDir =
        typeof req.body?.templatesDir === 'string' && req.body.templatesDir.trim()
          ? req.body.templatesDir.trim()
          : undefined;

      const result = await generateComplianceDocs({
        masterFile: masterFile.buffer,
        ...(templatesDir ? { templatesDir } : {}),
      });

      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Regnix_Excel_Pack_${stamp}.zip"`,
        'Content-Length': String(result.zipBuffer.length),
        'X-File-Count': String(result.fileNames.length),
        'X-Row-Count': String(result.rowCount),
        'X-File-Names': JSON.stringify(result.fileNames),
      });

      res.send(Buffer.from(result.zipBuffer));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      console.error('[generate-docs] Error:', message);

      if (!res.headersSent) {
        res.status(500).json({ error: message });
        return;
      }

      next(err);
    }
  }
);

router.get('/download-template', (_req: Request, res: Response) => {
  const candidates = [
    path.join(process.cwd(), 'public', 'templates', 'RegnixMain.xlsx'),
    path.join(process.cwd(), 'public', 'RegnixMain.xlsx'),
    path.join(process.cwd(), 'public', 'Regnix.xlsx'),
    path.join(process.cwd(), 'public', 'templates', 'Regnix.xlsx'),
  ];

  const found = candidates.find((p) => fs.existsSync(p));

  if (!found) {
    res.status(404).json({
      error: 'Template not found. Place RegnixMain.xlsx in public/templates/ or public/.',
    });
    return;
  }

  res.download(found, 'RegnixMain_Template.xlsx');
});

export default router;