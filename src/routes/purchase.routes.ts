import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as purchaseController from '../controllers/purchase.controller';

const router = Router();

router.get('/', authMiddleware, purchaseController.list);
router.get('/:id', authMiddleware, purchaseController.getById);

export default router;
