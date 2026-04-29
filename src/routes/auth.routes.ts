import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [auth]
 *     summary: Registrar un usuario nuevo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, full_name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               full_name: { type: string }
 *     responses:
 *       '201':
 *         description: Usuario creado
 *       '409':
 *         description: El email ya está registrado
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [auth]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/login', login);

export default router;
