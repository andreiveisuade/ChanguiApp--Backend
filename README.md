# ChanguiApp — Backend

**Equipo:** Andrei Veis (SM), Ignacio Melinc (PO), Ezequiel Lupis, Ignacio Rodriguez, Maximo Vendramini

API REST para ChanguiApp. Escaneo de productos, comparacion de precios con Precios Claros (SEPA), carrito, listas de compras y pagos con Mercado Pago.

> **El backend esta migrando a TypeScript** (ver `DEV-160`). Las nuevas features y PRs se escriben en TypeScript. Los archivos `.js` existentes se reemplazan por `.ts` durante el refactor; no agregar codigo nuevo en `.js`.

## Setup

```bash
git clone https://github.com/andreiveisuade/ChanguiApp--Backend.git
cd ChanguiApp--Backend
git checkout dev
npm install
cp .env.example .env   # completar credenciales
npm run dev             # http://localhost:3000 (tsx watch, hot reload)
```

Base de datos: ver [`docs/db-setup.md`](./docs/db-setup.md) para inicializar el schema en Supabase.

## Produccion

https://changuiapp-backend.onrender.com — auto-deploy desde `main` via Render.

## Stack

| Capa | Tecnologia |
|------|-----------|
| Lenguaje | **TypeScript** (migrando desde JavaScript, ver DEV-160) |
| Runtime | Node.js + Express |
| Base de datos | Supabase (PostgreSQL, region sa-east-1) |
| Auth | Supabase Auth (email/password) |
| Pagos | Mercado Pago SDK (modo sandbox) |
| Precios | Precios Claros / SEPA → cron sync hacia Supabase |
| Deploy | Render |
| Docs API | OpenAPI 3.0 + swagger-ui-express |
| Testing | Jest + Supertest + ts-jest |

## Mercado Pago

Integracion con **Checkout Pro** (flujo hosted). El backend crea una preferencia de pago via `POST /api/checkout` y devuelve un `init_point` que el cliente abre en WebView. Las confirmaciones llegan al `POST /api/checkout/webhook`, que crea el registro en `purchases` y cierra el carrito.

## Cron Jobs

- **sync-precios-claros** (diario, 03:00 UTC): invoca `POST /api/admin/sync-precios-claros` con header `X-Admin-Token`. Configurado en Render Dashboard. Sincroniza catalogo Precios Claros (SEPA) a Supabase.

## Arquitectura

```
Request → Route → Controller → Service → Repository → Supabase
```

Cada capa solo habla con la siguiente. Ver [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md) y [`docs/diagramas-secuencia/`](./docs/diagramas-secuencia/) para el detalle.

```
src/
├── index.ts                # bootstrap Express, monta rutas, Swagger UI
├── config/                 # clientes: supabase, mercadopago
├── routes/                 # definicion de rutas Express
├── controllers/            # validacion input + response
├── services/               # logica de negocio
├── repositories/           # queries a Supabase
├── middleware/             # auth, error handler
└── types/                  # tipos compartidos (post DEV-160)
```

Post-migracion a TS, la extension de todos los archivos en `src/` y `__tests__/` es `.ts`.

## Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/health` | Healthcheck |
| GET | `/api/docs` | Swagger UI (OpenAPI 3.0) |
| POST | `/api/auth/register` | Registro con email |
| POST | `/api/auth/login` | Inicio de sesion |
| GET | `/api/users/profile` | Obtener perfil del usuario |
| PUT | `/api/users/profile` | Editar perfil |
| DELETE | `/api/users/profile` | Eliminar cuenta |
| GET | `/api/products/barcode/:code` | Buscar producto por codigo de barras |
| GET | `/api/cart` | Ver carrito |
| POST | `/api/cart/items` | Agregar producto al carrito |
| PUT | `/api/cart/items/:id` | Modificar cantidad |
| DELETE | `/api/cart/items/:id` | Eliminar producto del carrito |
| POST | `/api/checkout` | Crear preferencia de pago (Mercado Pago) |
| POST | `/api/checkout/webhook` | Webhook de notificacion de pago |
| GET | `/api/purchases` | Historial de compras |
| GET | `/api/purchases/:id` | Detalle de una compra |
| GET | `/api/stores` | Listar supermercados (pospuesto post-MVP, DEV-112) |
| GET | `/api/lists` | Listas de compras (pospuesto post-MVP) |

Spec completa interactiva en http://localhost:3000/api/docs (tras `npm run dev`).

## Usuario Admin y Clientes de Supabase

El backend maneja dos clientes de Supabase con permisos diferenciados:

| Cliente | Key | Uso |
|---------|-----|-----|
| `supabase` | `SUPABASE_ANON_KEY` | Validar JWTs de usuarios. Respeta RLS. Uso general en repositories. |
| `supabaseAdmin` | `SUPABASE_SERVICE_ROLE_KEY` | Operaciones administrativas (sync de catálogo, seeds, migraciones). Bypassa RLS. |

**Regla:** importar `supabaseAdmin` solo en repositories de operaciones admin. Nunca en endpoints de usuario.

Existe un usuario admin registrado en Supabase Authentication (`admin@changuiapp.com`) para gestión manual desde el dashboard.

## Scripts

```bash
npm run dev              # tsx watch src/index.ts — hot reload en desarrollo
npm run build            # tsc — compila TypeScript a dist/
npm start                # node dist/index.js — produccion (post-build)
npm test                 # Jest con ts-jest
npm run test:watch       # watch mode
npm run test:coverage    # reporte de cobertura
```

> Los scripts con `tsc`/`tsx` son la convencion post-DEV-160. Mientras el refactor este abierto, los equivalentes en JS (`nodemon`, `node`) siguen funcionando.

## Docs

- [ARQUITECTURA.md](./docs/ARQUITECTURA.md) — arquitectura del sistema
- [diagramas-secuencia/](./docs/diagramas-secuencia/) — auth, scan & go, pago
- [DER/](./docs/DER/) — diagrama entidad-relacion
- [db-setup.md](./docs/db-setup.md) — inicializacion de Supabase
- [openapi.yaml](./docs/openapi.yaml) — spec OpenAPI 3.0 (post DEV-142)
- [Plan_de_Pruebas.md](./docs/Plan_de_Pruebas.md) — estrategia y casos de test (post DEV-148)
- [TESTING.md](./docs/TESTING.md) — playbook de testing
- [Scope completo](./docs/Scope_ChanguiApp.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md) — GitFlow, commits, PRs, convenciones TypeScript
- [Frontend](https://github.com/andreiveisuade/ChanguiApp--Frontend)
- [Jira](https://andreiveis360.atlassian.net/jira/software/projects/DEV/boards/1)

## Seguridad

### Protecciones implementadas

| Medida | Libreria | Descripcion |
|--------|----------|-------------|
| Headers HTTP seguros | `helmet` | Agrega headers de seguridad en todas las respuestas |
| CORS restringido | `cors` | Solo acepta requests de origins autorizados |
| Rate limiting global | `express-rate-limit` | Max 100 requests por IP cada 15 minutos |
| Rate limiting auth | `express-rate-limit` | Max 10 intentos en `/api/auth` cada 15 minutos |
| Validacion de inputs | `express-validator` | Valida y sanitiza inputs en endpoints que reciben datos |
| Autenticacion | `middleware/auth.ts` | Valida token Supabase en todos los endpoints protegidos |
| Manejo de errores | `index.ts` | No expone stack traces ni informacion interna |

### Variables de entorno requeridas

```env
SUPABASE_URL=              # URL del proyecto Supabase
SUPABASE_ANON_KEY=         # Clave publica Supabase (valida JWTs)
SUPABASE_SERVICE_ROLE_KEY= # Clave privada Supabase (solo operaciones admin)
MP_ACCESS_TOKEN=           # Access token Mercado Pago
PRECIOS_CLAROS_URL=        # URL base API Precios Claros (SEPA)
ALLOWED_ORIGINS=           # Origins permitidos para CORS (separados por coma)
PORT=3000                  # Puerto del servidor (default 3000)
```

> El archivo `.env` nunca se commitea al repositorio. Esta en `.gitignore`.
> Usar `.env.example` como referencia para configurar el entorno local.

UADE — Desarrollo de Aplicaciones I — 2026
