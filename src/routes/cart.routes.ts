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
 *     summary: Agregar un item al carrito activo (lo crea si no existe)
 *     description: |
 *       Si el usuario ya tiene un carrito activo, agrega el item a ese carrito.
 *       Si no tiene, crea uno nuevo en `store_id` (en ese caso `store_id` es obligatorio).
 *       Una vez creado el carrito, los items siguientes no necesitan `store_id`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, unit_price, quantity]
 *             properties:
 *               product_id: { type: string, format: uuid, example: "02b8eddd-532c-4234-b947-94f29a303931" }
 *               unit_price: { type: number, format: float, example: 4999.99 }
 *               quantity: { type: integer, minimum: 1, example: 1 }
 *               store_id:
 *                 type: string
 *                 format: uuid
 *                 description: "Solo requerido si el usuario no tiene carrito activo (se usa para crear uno nuevo)."
 *                 example: "702ca20d-7ac7-45f6-8e0a-5b1f67235a15"
 *     responses:
 *       '201':
 *         description: Item agregado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CartItem' }
 *       '400':
 *         description: product_id o unit_price faltante, o store_id requerido para crear carrito nuevo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
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
