import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as cartController from '../controllers/cart.controller';

const router = Router();

// CRÍTICO: DELETE '/' debe registrarse ANTES de DELETE '/items/:id'
router.delete('/', authMiddleware, cartController.cancelCart);
router.get('/', authMiddleware, cartController.getCart);
router.post('/items', authMiddleware, cartController.addItem);
router.put('/items/:id', authMiddleware, cartController.updateItem);
router.delete('/items/:id', authMiddleware, cartController.removeItem);

export default router;
