import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { requireAdminToken } from '../middleware/adminAuth';

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

/**
 * @swagger
 * /api/admin/products/bulk:
 *   post:
 *     tags: [admin]
 *     security: [{ adminAuth: [] }]
 *     summary: Ingestar un lote de productos crudos de Precios Claros
 *     description: |
 *       Recibe un lote de productos en el formato crudo de Precios Claros (tal
 *       como los baja el runner de CI) y los upsertea por `barcode`. El backend
 *       no llama a Precios Claros: el fetch al CDN lo hace el runner porque la
 *       IP saliente del free tier de Render está filtrada por el CDN. Idempotente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productos]
 *             properties:
 *               productos:
 *                 type: array
 *                 items: { type: object }
 *     responses:
 *       '200':
 *         description: Cantidad de productos upserteados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 upserted: { type: integer, example: 100 }
 *       '400':
 *         description: productos faltante o no es un array
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/products/bulk', adminController.ingestProductsHandler);

/**
 * @swagger
 * /api/admin/products/{barcode}/tax-category:
 *   post:
 *     tags: [admin]
 *     security: [{ adminAuth: [] }]
 *     summary: Override manual de la categoría fiscal de un producto
 *     description: |
 *       Fija la categoría fiscal del producto y lo bloquea (`tax_locked = true`)
 *       para que el sync/reclasificación no lo pisen. Útil cuando la heurística
 *       clasifica mal un producto puntual.
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_id]
 *             properties:
 *               category_id: { type: string, example: carnes }
 *     responses:
 *       '200':
 *         description: Categoría actualizada
 *       '400':
 *         description: category_id faltante o inválido
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/products/:barcode/tax-category', adminController.overrideTaxCategoryHandler);

/**
 * @swagger
 * /api/admin/reclassify:
 *   post:
 *     tags: [admin]
 *     security: [{ adminAuth: [] }]
 *     summary: Reclasificar todos los productos no bloqueados por categoría fiscal
 *     description: |
 *       Backfill de la clasificación fiscal. Recorre los productos con
 *       `tax_locked = false`, los clasifica por keywords (Ley 23.349) y
 *       actualiza su categoría. Permite aplicar cambios de keywords sin
 *       esperar al sync nocturno.
 *     responses:
 *       '200':
 *         description: Cantidad de productos clasificados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classified: { type: integer, example: 8021 }
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/reclassify', adminController.reclassifyHandler);

export default router;
