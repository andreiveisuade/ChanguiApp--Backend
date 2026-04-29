import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags: [users]
 *     security: [{ bearerAuth: [] }]
 *     summary: Obtener perfil del usuario autenticado
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/profile', authMiddleware, userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     tags: [users]
 *     security: [{ bearerAuth: [] }]
 *     summary: Actualizar perfil del usuario autenticado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserUpdate' }
 *     responses:
 *       '200':
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/profile', authMiddleware, userController.updateProfile);

/**
 * @swagger
 * /api/users/profile:
 *   delete:
 *     tags: [users]
 *     security: [{ bearerAuth: [] }]
 *     summary: Eliminar la cuenta del usuario autenticado
 *     responses:
 *       '200':
 *         description: Cuenta eliminada
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/profile', authMiddleware, userController.deleteProfile);

export default router;
