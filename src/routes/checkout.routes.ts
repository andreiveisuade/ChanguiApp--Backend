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
 * /api/checkout/status:
 *   get:
 *     tags: [checkout]
 *     security: [{ bearerAuth: [] }]
 *     summary: Estado del pago asociado a una preferencia (confirmacion determinista)
 *     parameters:
 *       - in: query
 *         name: preference_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Estado de la compra
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [pending, completed, failed, not_found]
 *       '400':
 *         description: Falta preference_id
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/status', authMiddleware, checkoutController.status);

/**
 * @swagger
 * /api/checkout/return:
 *   get:
 *     tags: [checkout]
 *     summary: Pagina de retorno de Mercado Pago (back_url) — reenvia al deep link de la app
 *     description: Endpoint publico invocado por el browser tras el pago — no requiere autenticacion.
 *     responses:
 *       '200':
 *         description: HTML que redirige a la app
 */
router.get('/return', checkoutController.returnPage);

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
