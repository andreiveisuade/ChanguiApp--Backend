# ChanguiApp — Backend

**Equipo:** Andrei Veis (SM), Ignacio Melinc (PO), Ezequiel Lupis, Ignacio Rodriguez, Maximo Vendramini

API REST para ChanguiApp. Escaneo de productos, comparacion de precios con Precios Claros (SEPA), carrito, listas de compras y pagos con Mercado Pago.

## Setup

```bash
git clone https://github.com/andreiveisuade/ChanguiApp--Backend.git
cd ChanguiApp--Backend
git checkout dev
npm install
cp .env.example .env   # completar credenciales
npm run dev             # http://localhost:3000
```

## Produccion

https://changuiapp-backend.onrender.com — auto-deploy desde `main` via Render.

## Stack

Node.js + Express + Supabase (PostgreSQL + Auth) + Mercado Pago SDK + Jest

## Arquitectura

```
Request → Route → Controller → Service → Repository → Supabase
```

Cada capa solo habla con la siguiente.

```
src/
├── index.js
├── config/supabase.js
├── routes/
├── controllers/
├── services/
├── repositories/
├── middleware/
└── utils/
```

## Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/health` | Healthcheck |
| POST | `/api/auth/register` | Registro con email o Google |
| POST | `/api/auth/login` | Inicio de sesion |
| GET | `/api/users/profile` | Obtener perfil del usuario |
| PUT | `/api/users/profile` | Editar perfil |
| DELETE | `/api/users/profile` | Eliminar cuenta |
| GET | `/api/products/barcode/:code` | Buscar producto por codigo de barras |
| GET | `/api/stores` | Listar supermercados cercanos |
| GET | `/api/cart` | Ver carrito |
| POST | `/api/cart/items` | Agregar producto al carrito |
| PUT | `/api/cart/items/:id` | Modificar cantidad |
| DELETE | `/api/cart/items/:id` | Eliminar producto del carrito |
| GET | `/api/lists` | Listar listas de compras |
| POST | `/api/lists` | Crear lista |
| PUT | `/api/lists/:id` | Editar lista |
| DELETE | `/api/lists/:id` | Eliminar lista |
| POST | `/api/lists/:id/items` | Agregar item a lista |
| DELETE | `/api/lists/:id/items/:itemId` | Eliminar item de lista |
| POST | `/api/checkout` | Crear preferencia de pago (Mercado Pago) |
| POST | `/api/checkout/webhook` | Webhook de notificacion de pago |
| GET | `/api/purchases` | Historial de compras |
| GET | `/api/purchases/:id` | Detalle de una compra |

Detalle completo en [docs/Scope_ChanguiApp.md](./docs/Scope_ChanguiApp.md#5-endpoints-del-backend).

## Scripts

```bash
npm run dev           # desarrollo (nodemon)
npm start             # produccion
npm test              # tests
npm run test:coverage # cobertura
```

## Docs

- [Scope completo](./docs/Scope_ChanguiApp.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md) — GitFlow, commits, PRs
- [Frontend](https://github.com/andreiveisuade/ChanguiApp--Frontend)
- [Jira](https://andreiveis360.atlassian.net/jira/software/projects/DEV/boards/1)

UADE — Desarrollo de Aplicaciones I — 2026
