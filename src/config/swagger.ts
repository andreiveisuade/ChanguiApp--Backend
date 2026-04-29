import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';

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
    { url: 'http://localhost:3000', description: 'Dev local' },
    { url: 'https://changuiapp-backend.onrender.com', description: 'Producción (Render)' },
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
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          full_name: { type: 'string' },
          avatar_url: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      UserUpdate: {
        type: 'object',
        properties: {
          full_name: { type: 'string' },
          avatar_url: { type: 'string' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          barcode: { type: 'string', example: '7790895000782' },
          name: { type: 'string' },
          brand: { type: 'string', nullable: true },
          price: { type: 'number', format: 'float' },
          image_url: { type: 'string', nullable: true },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          cart_id: { type: 'string', format: 'uuid' },
          product_id: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer' },
          unit_price: { type: 'number' },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          store_id: { type: 'string', format: 'uuid', nullable: true },
          status: {
            type: 'string',
            enum: ['active', 'checked_out', 'closed'],
          },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/CartItem' },
          },
        },
      },
      CheckoutResponse: {
        type: 'object',
        properties: {
          preference_id: { type: 'string' },
          init_point: { type: 'string', format: 'uri' },
        },
      },
      Purchase: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          total: { type: 'number' },
          payment_id: { type: 'string' },
          payment_status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed'],
          },
          created_at: { type: 'string', format: 'date-time' },
          store_id: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      PurchaseItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          purchase_id: { type: 'string', format: 'uuid' },
          product_name: { type: 'string' },
          barcode: { type: 'string' },
          quantity: { type: 'integer' },
          unit_price: { type: 'number' },
        },
      },
      PurchaseDetail: {
        allOf: [
          { $ref: '#/components/schemas/Purchase' },
          {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/PurchaseItem' },
              },
            },
          },
        ],
      },
      Store: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Carrefour Express - Recoleta' },
          chain: { type: 'string', nullable: true, example: 'Carrefour' },
          address: { type: 'string', nullable: true },
          lat: { type: 'number', format: 'float' },
          lng: { type: 'number', format: 'float' },
          distanceKm: { type: 'number', format: 'float', nullable: true },
        },
      },
      SyncStats: {
        type: 'object',
        properties: {
          inserted: { type: 'integer' },
          updated: { type: 'integer' },
          errors: { type: 'integer' },
          duration_ms: { type: 'integer' },
        },
      },
    },
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
