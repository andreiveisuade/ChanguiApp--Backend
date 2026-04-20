import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as productController from '../controllers/product.controller';

const router = Router();

router.get('/barcode/:code', authMiddleware, productController.getByBarcode);

export default router;
