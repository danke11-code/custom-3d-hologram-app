import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { convertMediaHandler, getJobsHandler, downloadBinHandler } from '../services/converterService';

const router = Router();

const TMP_DIR = path.join(path.resolve(__dirname, '..', '..'), 'tmp');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TMP_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.post('/convert', upload.array('files'), convertMediaHandler);
router.get('/jobs', getJobsHandler);
router.get('/download/:filename', downloadBinHandler);

export default router;
