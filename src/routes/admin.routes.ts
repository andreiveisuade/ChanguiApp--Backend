import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { requireAdminToken } from '../config/adminAuth';

const router = Router();

router.use(requireAdminToken);

/**
 * @swagger
 * /api/admin/sync-precios-claros:
 *   post:
 *     tags: [admin]
 *     security: [{ adminAuth: [] }]
 *     summary: Disparar sync del catálogo desde Precios Claros (fire-and-forget)
 *     description: |
 *       Crea un job de sincronización y devuelve inmediatamente con `202 Accepted` + `sync_id`.
 *       El sync corre en background. Para ver progreso, consultar `GET /api/admin/sync-precios-claros/{id}`.
 *       Si ya hay un sync en curso (`status='running'`) devuelve `409 Conflict`.
 *     responses:
 *       '202':
 *         description: Sync encolado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SyncAccepted' }
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '409':
 *         description: Ya hay un sync en curso
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/sync-precios-claros', adminController.startSyncPreciosClarosHandler);

/**
 * @swagger
 * /api/admin/sync-precios-claros/{id}:
 *   get:
 *     tags: [admin]
 *     security: [{ adminAuth: [] }]
 *     summary: Estado de un job de sync
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       '200':
 *         description: Estado del job
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SyncJob' }
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/sync-precios-claros/:id', adminController.getSyncPreciosClarosStatusHandler);

export default router;
