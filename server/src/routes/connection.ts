import { Router } from 'express';
import { smartConfigHandler, testConnectionHandler } from '../services/connectionService';

const router = Router();

router.post('/test', testConnectionHandler);
router.post('/smartconfig', smartConfigHandler);

export default router;
