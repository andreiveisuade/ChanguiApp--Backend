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
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 6 }
 *               name: { type: string, description: "Nombre completo del usuario, se guarda como full_name en la tabla users" }
 *     responses:
 *       '201':
 *         description: Usuario creado
 *       '400':
 *         description: Email/password/name faltantes o formato invalido
 *       '409':
 *         description: El email ya esta registrado
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
