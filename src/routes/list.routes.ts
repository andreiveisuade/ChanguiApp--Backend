import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import {
  createListValidators,
  listItemValidators,
  listItemUpdateValidators,
  validate,
} from '../middleware/validators';
import * as listController from '../controllers/list.controller';

const router = Router();

/**
 * @swagger
 * /api/lists:
 *   get:
 *     tags: [lists]
 *     security: [{ bearerAuth: [] }]
 *     summary: Listar las listas de compras del usuario
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authMiddleware, listController.list);

/**
 * @swagger
 * /api/lists:
 *   post:
 *     tags: [lists]
 *     security: [{ bearerAuth: [] }]
 *     summary: Crear una lista de compras
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Compras del sábado" }
 *     responses:
 *       '201':
 *         description: Lista creada
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authMiddleware, createListValidators, validate, listController.create);

/**
 * @swagger
 * /api/lists/{id}:
 *   get:
 *     tags: [lists]
 *     security: [{ bearerAuth: [] }]
 *     summary: Obtener una lista con sus items
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authMiddleware, listController.getById);

/**
 * @swagger
 * /api/lists/{id}:
 *   put:
 *     tags: [lists]
 *     security: [{ bearerAuth: [] }]
 *     summary: Renombrar una lista
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authMiddleware, createListValidators, validate, listController.rename);

/**
 * @swagger
 * /api/lists/{id}:
 *   delete:
 *     tags: [lists]
 *     security: [{ bearerAuth: [] }]
 *     summary: Eliminar una lista (borra sus items en cascada)
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       '200':
 *         description: Lista eliminada
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authMiddleware, listController.remove);

/**
 * @swagger
 * /api/lists/{id}/items:
 *   post:
 *     tags: [lists]
 *     security: [{ bearerAuth: [] }]
 *     summary: Agregar un item a una lista
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_name]
 *             properties:
 *               product_name: { type: string, example: "Leche" }
 *               barcode: { type: string, nullable: true }
 *               quantity: { type: integer, minimum: 1, nullable: true }
 *     responses:
 *       '201':
 *         description: Item agregado
 *       '400':
 *         description: product_name faltante
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/items', authMiddleware, listItemValidators, validate, listController.addItem);

/**
 * @swagger
 * /api/lists/{id}/items/{itemId}:
 *   put:
 *     tags: [lists]
 *     security: [{ bearerAuth: [] }]
 *     summary: Actualizar un item (cantidad y/o tachado)
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *       - { name: itemId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: integer, minimum: 1 }
 *               purchased: { type: boolean }
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/:id/items/:itemId',
  authMiddleware,
  listItemUpdateValidators,
  validate,
  listController.updateItem
);

/**
 * @swagger
 * /api/lists/{id}/items/{itemId}:
 *   delete:
 *     tags: [lists]
 *     security: [{ bearerAuth: [] }]
 *     summary: Eliminar un item de una lista
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *       - { name: itemId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       '200':
 *         description: Item eliminado
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id/items/:itemId', authMiddleware, listController.removeItem);

export default router;
