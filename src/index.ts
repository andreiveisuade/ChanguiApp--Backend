import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config';
import cartRoutes from './routes/cart.routes';
import productRoutes from './routes/product.routes';
import userRoutes from './routes/user.routes';
import purchaseRoutes from './routes/purchase.routes';
import checkoutRoutes from './routes/checkout.routes';
import storeRoutes from './routes/store.routes';
import adminRoutes from './routes/admin.routes';
import { ApiError } from './types/domain';

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// OpenAPI / Swagger UI
const openapiSpec = YAML.parse(
  fs.readFileSync(path.join(__dirname, '..', 'docs', 'openapi.yaml'), 'utf8')
);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Rutas del MVP
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
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
  });
};
app.use(errorHandler);

// Solo levanta el servidor si se ejecuta directamente (no en tests)
if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
module.exports = app;