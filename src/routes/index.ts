import type { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import userRoutes from './user.routes';
import purchaseRoutes from './purchase.routes';
import checkoutRoutes from './checkout.routes';
import cartRoutes from './cart.routes';
import storeRoutes from './store.routes';
import adminRoutes from './admin.routes';

// Monta healthcheck, Swagger UI y todos los routers del MVP sobre la app.
export function registerRoutes(app: Express): void {
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
  // persistAuthorization: true guarda el Bearer token en localStorage del browser,
  // asi se mantiene entre recargas y al cambiar de pestana de Swagger.
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  // Rutas del MVP
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/purchases', purchaseRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/stores', storeRoutes);
  app.use('/api/admin', adminRoutes);
}
