import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { generateComplianceDocs } from '../services/documentGeneratorService';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

const uploadFields = upload.fields([
  { name: 'master', maxCount: 1 },
  { name: 'header', maxCount: 1 },
  { name: 'footer', maxCount: 1 },
]);

router.post('/generate-docs', uploadFields, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
    if (!files?.master?.[0]) {
      res.status(400).json({ error: 'Missing required master workbook (RegnixMain.xlsx).' });
      return;
    }

    const masterFile = files.master[0];

    const result = await generateComplianceDocs({
      masterFile: masterFile.buffer,
      templatesBaseUrl: '/templates',
    });

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="Regnix_Excel_Pack_${timestamp}.zip"`,
      'Content-Length': String(result.zipBuffer.length),
      'X-File-Count': String(result.fileNames.length),
      'X-Row-Count': String(result.rowCount),
    });
    res.send(Buffer.from(result.zipBuffer));
  } catch (err) {
    next(err);
  }
});

export default router;
