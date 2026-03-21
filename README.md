# ChanguiApp — Backend

API REST en Node.js + Express para ChanguiApp — Carrito de Compras Inteligente.
Integra la API de Precios Claros (SEPA) del gobierno argentino para obtener precios reales de productos de supermercado, con autenticacion via Supabase Auth y persistencia en PostgreSQL.

---

## Quickstart

```bash
# 1. Clonar e instalar
git clone https://github.com/andreiveisuade/ChanguiApp--Backend.git
cd ChanguiApp--Backend
git checkout dev
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Completar con tus credenciales (ver sección "Variables de Entorno")

# 3. Levantar servidor en desarrollo
npm run dev

# 4. Verificar que funciona
curl http://localhost:3000/health
# Debería devolver: {"status":"ok"}
```

El servidor estara disponible en `http://localhost:3000`

---

## Stack

| Capa | Tecnologia | Descripcion |
|------|-----------|-------------|
| Runtime | Node.js >= 18 | JavaScript en servidor |
| Framework | Express | Web server y routing |
| BD | Supabase (PostgreSQL) | Persistencia de datos |
| Auth | Supabase Auth | Google Sign-In + email/contrasena |
| APIs Externas | Precios Claros (SEPA) | Precios de productos (gobierno AR) |
| Pagos | Mercado Pago SDK | Pasarela de pagos (sandbox) |
| Docs API | Swagger / OpenAPI | Documentacion interactiva |
| Testing | Jest + Supertest | Tests unitarios y de integracion |
| Deploy | Render | Hosting gratuito |

---

## Arquitectura (MVVM + Repository)

```
src/
├── index.js              # Entry point: Express app, CORS, rutas, listen
├── config/
│   └── supabase.js       # Cliente Supabase inicializado
├── routes/               # Definicion de rutas Express (solo recibe request y llama controller)
├── controllers/          # Validacion de input + orquestacion + response con status code
├── services/             # Logica de negocio pura (ej: al agregar al carrito, verificar lista)
├── repositories/         # Unica capa que habla con Supabase (queries, inserts, updates)
├── middleware/           # Auth middleware, error handler
└── utils/                # Helpers genericos
```

**Regla clave:** cada capa solo habla con la siguiente. Un controller nunca toca Supabase directamente — pasa por service y repository.

```
Request → Route → Controller → Service → Repository → Supabase
```

---

## Variables de Entorno

Copiar `.env.example` a `.env` y completar con los valores reales:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Supabase (obtener de https://supabase.com → proyecto → Settings → API)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Mercado Pago (obtener de https://www.mercadopago.com.ar/developers)
MERCADO_PAGO_ACCESS_TOKEN=TEST-...

# Precios Claros (API publica, sin key necesaria)
PRECIOS_CLAROS_BASE_URL=https://d3e6htiiul5ek9.cloudfront.net/prod
```

Las credenciales reales se comparten por el grupo de WhatsApp del equipo. Nunca commitear el `.env`.

---

## Endpoints

Ver documentacion completa en [docs/Scope_ChanguiApp.md](./docs/Scope_ChanguiApp.md#5-endpoints-del-backend)

### Resumen rapido

| Grupo | Endpoints | Descripcion |
|-------|-----------|-------------|
| Sistema | `GET /health` | Healthcheck |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` | Registro e inicio de sesion |
| Usuarios | `GET/PUT/DELETE /api/users/profile` | CRUD de perfil |
| Productos | `GET /api/products/barcode/:code` | Consulta por codigo de barras |
| Supermercados | `GET /api/stores` | Listar supermercados |
| Carrito | `GET /api/cart`, `POST/PUT/DELETE /api/cart/items` | CRUD de carrito |
| Listas | `CRUD /api/lists`, `CRUD /api/lists/:id/items` | Listas de compras |
| Pagos | `POST /api/checkout`, `POST /api/checkout/webhook` | Mercado Pago |
| Historial | `GET /api/purchases`, `GET /api/purchases/:id` | Compras anteriores |

### Probar rapido

```bash
# Healthcheck
curl http://localhost:3000/health

# Producto por barcode (Coca-Cola 500ml)
curl "http://localhost:3000/api/products/barcode/7790040116909"
```

---

## Testing

```bash
# Correr tests
npm test

# Correr tests con reporte de cobertura
npm run test:coverage
```

Regla del equipo: cada endpoint nuevo se entrega con su test correspondiente en la misma PR.

---

## Scripts

```bash
npm run dev          # Levantar con nodemon (hot reload)
npm start            # Levantar en produccion
npm test             # Correr tests con Jest
npm run test:coverage # Tests + reporte de cobertura
```

---

## Documentacion del proyecto

| Documento | Descripcion |
|-----------|-------------|
| [docs/Scope_ChanguiApp.md](./docs/Scope_ChanguiApp.md) | Alcance completo: objetivos, stack, endpoints, CRUDs, entregables, criterios de aceptacion |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | GitFlow, convenciones de commits, como abrir PRs, como hacer reviews |

---

## Equipo

| Integrante | Rol |
|------------|-----|
| Andrei Veis | Scrum Master |
| Ignacio Melinc | Product Owner |
| Ezequiel Lupis | Desarrollador |
| Ignacio Rodriguez | Desarrollador |
| Maximo Vendramini | Desarrollador |

Roles tecnicos (Tech Lead, UX/UI Lead, QA) son rotativos por sprint.

---

## Links

- Frontend: [ChanguiApp--Frontend](https://github.com/andreiveisuade/ChanguiApp--Frontend)
- Jira: [ChanguiApp Board](https://andreiveis360.atlassian.net)
- Figma: (link del archivo de Figma del equipo)

---

UADE — Desarrollo de Aplicaciones I — 2026
