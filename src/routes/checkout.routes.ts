import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as checkoutController from '../controllers/checkout.controller';

const router = Router();

router.post('/', authMiddleware, checkoutController.create);
router.post('/webhook', checkoutController.webhook);

export default router;
