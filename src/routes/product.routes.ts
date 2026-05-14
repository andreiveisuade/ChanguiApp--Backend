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

export default router;
