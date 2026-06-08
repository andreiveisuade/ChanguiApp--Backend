import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as productController from '../controllers/product.controller';

const router = Router();

/**
 * @swagger
 * /api/products/barcode/{code}:
 *   get:
 *     tags: [products]
 *     security: [{ bearerAuth: [] }]
 *     summary: Buscar producto por código de barras
 *     parameters:
 *       - name: code
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         description: EAN/UPC del producto escaneado
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/barcode/:code', authMiddleware, productController.getByBarcode);

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [products]
 *     security: [{ bearerAuth: [] }]
 *     summary: Catálogo incremental para el cache local (sync por delta)
 *     description: |
 *       Devuelve los productos con `updated_at` mayor a `updated_since`, paginado.
 *       Sin `updated_since` devuelve todo el catálogo (primer arranque del front).
 *       El cliente guarda `next_cursor` y lo manda como `updated_since` en el
 *       próximo sync para traer solo lo que cambió.
 *     parameters:
 *       - name: updated_since
 *         in: query
 *         required: false
 *         schema: { type: string, format: date-time }
 *         description: Fecha ISO del último sync local. Omitir para bajar todo.
 *       - name: limit
 *         in: query
 *         required: false
 *         schema: { type: integer, default: 500, maximum: 1000 }
 *       - name: offset
 *         in: query
 *         required: false
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       '200':
 *         description: Página del catálogo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 *                 count: { type: integer }
 *                 has_more: { type: boolean }
 *                 next_cursor: { type: string, format: date-time, nullable: true }
 *       '400':
 *         description: updated_since inválido
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, productController.getCatalog);

export default router;
