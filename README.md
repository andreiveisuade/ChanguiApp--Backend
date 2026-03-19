# ChanguiApp — Backend

API REST en Node.js + Express para ChanguiApp. Integra la API de Precios Claros (SEPA) del gobierno argentino para obtener precios reales de productos de supermercado.

## Stack

- Node.js + Express
- Arquitectura en capas + Repository pattern
- Firebase Auth
- Swagger para documentación de endpoints
- Deploy en Railway / Render (capa gratuita)

## Requisitos

- Node.js >= 18

## Setup

```bash
npm install
npm run dev
```

## API de Precios Claros

Base URL: `https://d3e6htiiul5ek9.cloudfront.net/prod`

| Endpoint | Descripción |
|----------|-------------|
| `GET /sucursales` | Sucursales cercanas (params: lat, lng, limit) |
| `GET /producto` | Precio de producto (params: id_producto, array_sucursales) |

## Equipo

| Integrante | Rol Sprint 1 |
|------------|-------------|
| Andrei Veis | Scrum Master |
| Ezequiel Lupis | TBD |
| Ignacio Melinc | TBD |
| Ignacio Rodriguez | TBD |

## Links

- [Frontend repo](https://github.com/andreiveisuade/ChanguiApp--Frontend)
- [Jira](TBD)
- [Swagger](TBD)

---

UADE — Desarrollo de Aplicaciones I — 2026
