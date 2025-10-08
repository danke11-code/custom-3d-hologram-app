import { Router } from 'express';
import { uploadBinsHandler } from '../services/tcpUploaderService';

const router = Router();

router.post('/upload', uploadBinsHandler);

export default router;
