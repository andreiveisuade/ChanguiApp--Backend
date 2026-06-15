import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { corsOptions } from './config/cors';
import { globalLimiter, authLimiter } from './middleware/rateLimit';
import { registerRoutes } from './routes';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Render (y la mayoria de PaaS) corren detras de un proxy reverso que setea
// X-Forwarded-For con la IP real del cliente. Sin esto, express-rate-limit
// agrupa todas las requests bajo la misma IP (la del proxy).
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(corsOptions));
app.use(globalLimiter); // aplica a toda la API
app.use('/api/auth', authLimiter); // aplica SOLO a login y registro
app.use(express.json());
// Logging de requests (se omite /health para no inundar los logs de Render)
app.use(morgan('tiny', { skip: (req) => req.path === '/health' }));

registerRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

// Solo levanta el servidor si se ejecuta directamente (no en tests)
if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
module.exports = app;
