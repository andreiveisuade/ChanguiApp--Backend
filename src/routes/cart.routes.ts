import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as cartController from '../controllers/cart.controller';

const router = Router();

// CRÍTICO: DELETE '/' debe registrarse ANTES de DELETE '/items/:id'

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     tags: [cart]
 *     security: [{ bearerAuth: [] }]
 *     summary: Cancelar el carrito activo del usuario
 *     responses:
 *       '200':
 *         description: Carrito cancelado
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/', authMiddleware, cartController.cancelCart);

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [cart]
 *     security: [{ bearerAuth: [] }]
 *     summary: Obtener carrito activo del usuario
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, cartController.getCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     tags: [cart]
 *     security: [{ bearerAuth: [] }]
 *     summary: Agregar un item al carrito activo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, quantity]
 *             properties:
 *               product_id: { type: string, format: uuid }
 *               quantity: { type: integer, minimum: 1 }
 *     responses:
 *       '201':
 *         description: Item agregado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CartItem' }
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/items', authMiddleware, cartController.addItem);

/**
 * @swagger
 * /api/cart/items/{id}:
 *   put:
 *     tags: [cart]
 *     security: [{ bearerAuth: [] }]
 *     summary: Modificar la cantidad de un item del carrito
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, minimum: 1 }
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CartItem' }
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/items/:id', authMiddleware, cartController.updateItem);

/**
 * @swagger
 * /api/cart/items/{id}:
 *   delete:
 *     tags: [cart]
 *     security: [{ bearerAuth: [] }]
 *     summary: Eliminar un item del carrito
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       '200':
 *         description: Item eliminado
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/items/:id', authMiddleware, cartController.removeItem);

export default router;
