import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as checkoutController from '../controllers/checkout.controller';

const router = Router();

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     tags: [checkout]
 *     security: [{ bearerAuth: [] }]
 *     summary: Crear preferencia de pago Mercado Pago a partir del carrito activo
 *     responses:
 *       '200':
 *         description: Preferencia creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CheckoutResponse' }
 *       '400':
 *         description: No hay carrito activo o está vacío
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authMiddleware, checkoutController.create);

/**
 * @swagger
 * /api/checkout/webhook:
 *   post:
 *     tags: [checkout]
 *     summary: Webhook público de Mercado Pago (notificación de pago)
 *     description: Endpoint público invocado por Mercado Pago — no requiere autenticación.
 *     responses:
 *       '200':
 *         description: Notificación procesada
 */
router.post('/webhook', checkoutController.webhook);

export default router;
