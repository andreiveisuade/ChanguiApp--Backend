import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as storeController from '../controllers/store.controller';

const router = Router();

/**
 * @swagger
 * /api/stores:
 *   get:
 *     tags: [stores]
 *     security: [{ bearerAuth: [] }]
 *     summary: Listado de sucursales/tiendas disponibles
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Store' }
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, storeController.list);

export default router;
