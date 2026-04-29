import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as storeController from '../controllers/store.controller';

const router = Router();

router.get('/', authMiddleware, storeController.list);

export default router;
