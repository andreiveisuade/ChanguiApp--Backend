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

`GET /health` · `POST /api/auth/register` · `POST /api/auth/login` · `GET/PUT/DELETE /api/users/profile` · `GET /api/products/barcode/:code` · `GET /api/stores` · `GET/POST/PUT/DELETE /api/cart/items` · `CRUD /api/lists` · `POST /api/checkout` · `GET /api/purchases`

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
