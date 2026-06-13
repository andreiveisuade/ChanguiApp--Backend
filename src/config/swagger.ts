import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import { schemas } from './swagger.schemas';

// Los globs cubren tanto dev (tsx ejecuta `.ts`) como prod (tsc compila a
// `dist/` y deja `.js`). swagger-jsdoc parsea los comentarios `@swagger` que
// cada route file declara arriba de sus handlers, más los de `index.ts`
// (donde vive `/health`).
const apis = [
  path.join(__dirname, '..', 'routes', '*.{ts,js}'),
  path.join(__dirname, '..', 'index.{ts,js}'),
];

const definition: swaggerJsdoc.SwaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'ChanguiApp API',
    description:
      'Backend REST de ChanguiApp — app de Scan & Go para supermercados argentinos.\n\n' +
      'Flujo principal: autenticación → escaneo de barcode → carrito → checkout Mercado Pago → historial.',
    version: '0.1.0',
    contact: {
      name: 'Equipo ChanguiApp',
      url: 'https://github.com/andreiveisuade/ChanguiApp--Backend',
    },
  },
  servers: [
    { url: 'https://changuiapp-backend.onrender.com', description: 'Producción (Render)' },
    { url: 'http://localhost:3000', description: 'Dev local' },
  ],
  tags: [
    { name: 'health' },
    { name: 'auth' },
    { name: 'users' },
    { name: 'products' },
    { name: 'cart' },
    { name: 'checkout' },
    { name: 'purchases' },
    { name: 'stores' },
    { name: 'admin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT de Supabase Auth',
      },
      adminAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Admin-Token',
        description: 'Token compartido para endpoints administrativos (sync, etc.)',
      },
    },
    schemas,
    responses: {
      Unauthorized: {
        description: 'Token faltante o inválido',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      BadRequest: {
        description: 'Request inválido',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({ definition, apis });
