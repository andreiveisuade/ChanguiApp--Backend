import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';

const router = Router();

/**
 * @swagger
 * /api/admin/sync-precios-claros:
 *   post:
 *     tags: [admin]
 *     security: [{ adminAuth: [] }]
 *     summary: Sincronizar catálogo desde Precios Claros (SEPA)
 *     description: Endpoint administrativo. Requiere header `X-Admin-Token` que matchee la env var `ADMIN_TOKEN` del servidor.
 *     responses:
 *       '200':
 *         description: Sync completado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SyncStats' }
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '500':
 *         description: Falló la sincronización
 */
router.post('/sync-precios-claros', adminController.syncPreciosClarosHandler);

export default router;
