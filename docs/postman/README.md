# Postman Collection — ChanguiApp Backend

Coleccion completa de los endpoints del MVP para Entrega 1.

## Importar

1. Abrir Postman.
2. **Import** > **File** > seleccionar `ChanguiApp-Backend.postman_collection.json`.
3. La coleccion aparece en el sidebar izquierdo.

## Configurar Environment

1. **Environments** (sidebar) > **Create Environment** > nombre: `ChanguiApp-Prod`.
2. Agregar 3 variables:

| Variable | Valor inicial |
|---|---|
| `base_url` | `https://changuiapp-backend.onrender.com` |
| `access_token` | (vacio, se setea automaticamente al hacer login) |
| `admin_token` | (el ADMIN_TOKEN configurado en Render) |

3. Seleccionar el Environment desde el dropdown arriba a la derecha.

## Para correr local en lugar de prod

Cambiar `base_url` a `http://localhost:3000` y levantar el server con `npm run dev`.

## Flujo recomendado

Ejecutar requests en este orden para una demo end-to-end:

1. **Health > GET /health** — verificar que el server responde
2. **Auth > POST /api/auth/register** — crear usuario nuevo
   - El test script guarda automaticamente `access_token` en el environment
3. **Users > GET /api/users/profile** — verificar perfil creado
4. **Stores > GET /api/stores** — listar tiendas
5. **Products > GET /api/products/barcode/:code** — buscar producto
6. **Cart > POST /api/cart/items** — agregar al carrito
7. **Cart > GET /api/cart** — ver carrito con items y total
8. **Checkout > POST /api/checkout** — crear preferencia MP
   - Devuelve `init_point` con URL para pagar en MP
9. (Pago real en MP sandbox)
10. **Webhook > POST /api/checkout/webhook** — MP llama esto, simulable manual
11. **Purchases > GET /api/purchases** — ver compra registrada
12. **Purchases > GET /api/purchases/:id** — detalle con items

## Endpoints admin

- **Admin > POST /api/admin/sync-precios-claros** — requiere `x-admin-token`. No es para demo, es interno.

## Tests automaticos en cada request

Los requests de **register** y **login** tienen scripts de Postman que guardan automaticamente el `access_token` en el environment, asi todos los siguientes requests autenticados funcionan sin intervencion manual.
