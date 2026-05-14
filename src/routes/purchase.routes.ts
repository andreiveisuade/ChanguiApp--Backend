import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as purchaseController from '../controllers/purchase.controller';

const router = Router();

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     tags: [purchases]
 *     security: [{ bearerAuth: [] }]
 *     summary: Historial de compras del usuario autenticado
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *         description: Filtrar por estado del pago
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Purchase' }
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, purchaseController.list);

/**
 * @swagger
 * /api/purchases/{id}:
 *   get:
 *     tags: [purchases]
 *     security: [{ bearerAuth: [] }]
 *     summary: Detalle de una compra (con items)
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PurchaseDetail' }
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authMiddleware, purchaseController.getById);

export default router;
