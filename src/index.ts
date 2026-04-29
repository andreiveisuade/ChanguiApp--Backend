import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config';
import { swaggerSpec } from './config/swagger';
import cartRoutes from './routes/cart.routes';
import productRoutes from './routes/product.routes';
import userRoutes from './routes/user.routes';
import purchaseRoutes from './routes/purchase.routes';
import checkoutRoutes from './routes/checkout.routes';
import storeRoutes from './routes/store.routes';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import { ApiError } from './types/domain';

const app = express();

// Render (y la mayoria de PaaS) corren detras de un proxy reverso que setea
// X-Forwarded-For con la IP real del cliente. Sin esto, express-rate-limit
// agrupa todas las requests bajo la misma IP (la del proxy).
app.set('trust proxy', 1);

app.use(helmet());
const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS?.split(',') ?? [
  'http://localhost:8081',
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
// Rate limiting global - para todos los endpoints
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  max: 100,                  // máximo 100 requests por IP en esa ventana
  message: 'Demasiadas solicitudes, intenta mas tarde.',
});

// Rate limiting estricto - solo para login y registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  max: 10,                   // máximo 10 intentos por IP
  message: 'Demasiados intentos de autenticacion, espera 15 minutos.',
});

app.use(globalLimiter);                      // aplica a toda la API
app.use('/api/auth', authLimiter);           // aplica SOLO a login y registro
app.use(express.json());

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [health]
 *     summary: Healthcheck
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// OpenAPI / Swagger UI — el spec se genera escaneando los comentarios @swagger
// de cada route file (ver src/config/swagger.ts).
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas del MVP
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/admin', adminRoutes);

// Error handler global
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err instanceof ApiError ? err.status : err.status || 500;

  // Logueamos el error en el servidor pero NUNCA lo mandamos al cliente
  console.error(`[ERROR] ${status} - ${err.message}`);

  // En produccion no exponemos detalles internos
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';

  res.status(status).json({ error: message });
};
app.use(errorHandler);

// Solo levanta el servidor si se ejecuta directamente (no en tests)
if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
module.exports = app;