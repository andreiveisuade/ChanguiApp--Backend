# Plan de Pruebas — ChanguiApp

> Documento de referencia para la Entrega 1 (30/04/2026). Describe la estrategia de testing del backend, las herramientas, los casos cubiertos y cómo se mapean a los tests automatizados.

---

## 1. Objetivos

- Garantizar que los endpoints del MVP cumplen los criterios de aceptación de sus tickets Jira.
- Detectar regresiones antes del merge a `test` y `main`.
- Validar el comportamiento end-to-end de los 5 flujos críticos (auth, productos, carrito, checkout, historial).
- Mantener una cobertura de tests automatizados ≥ 70% en código crítico (services y repositories).

## 2. Alcance

**Incluye:**
- Backend REST (Node.js + TypeScript + Express + Supabase + Mercado Pago).
- Autenticación vía Supabase Auth.
- Los 13 endpoints del MVP declarados en `docs/openapi.yaml`.
- Integración con Mercado Pago en modo sandbox.

**Fuera de alcance:**
- Frontend React Native (entrega 2).
- Endpoints pospuestos post-MVP: `GET /api/stores` (DEV-112), módulo de listas (DEV-162+).
- Pruebas de carga o performance (entrega 2).
- Seguridad ofensiva (no hay pentesting en esta entrega).

## 3. Tipos de prueba

### 3.1 Pruebas unitarias (Jest + ts-jest)

- Testean **services** y **repositories** en aislamiento.
- Los services mockean sus repositories. Los repositories mockean el cliente de Supabase.
- Ubicación: `__tests__/unit/{services,repositories}/*.test.ts`.
- Target: ≥ 80% de cobertura en services.

### 3.2 Pruebas de integración (Jest + Supertest)

- Hacen requests HTTP reales contra la app Express sin levantar servidor.
- Mockean las dependencias externas (Supabase client, SDK de Mercado Pago).
- Validan el flujo completo `request → middleware → controller → service → response`.
- Ubicación: `__tests__/integration/*.test.ts`.
- Target: cubrir todos los endpoints MVP con al menos 3 casos (happy path, error path, auth missing).

### 3.3 Pruebas manuales (Swagger UI + Postman)

- Se ejecutan antes del merge `dev → test → main` usando el **Swagger UI** disponible en `GET /api/docs` y Postman como complemento.
- Smoke test de todos los endpoints contra un Supabase real (staging).
- Validación del flujo completo: register → login → scan → agregar al carrito → checkout sandbox → ver historial.

## 4. Herramientas

| Herramienta | Uso |
|---|---|
| **Jest** | Test runner principal |
| **ts-jest** | Compilar tests TypeScript |
| **Supertest** | Requests HTTP contra la app Express |
| **Swagger UI** | Exploración interactiva + smoke test manual (`/api/docs`) |
| **Postman** | Testing manual de endpoints contra entornos staging/prod |
| **GitHub Actions** | Ejecuta `npm test` en cada PR (CI) |

## 5. Definition of Done

Un endpoint se considera terminado cuando:

1. Pasa sus **tests de integración** (happy path + al menos 2 error paths: validación + auth).
2. Sigue la arquitectura **Route → Controller → Service → Repository**.
3. Está **documentado en `docs/openapi.yaml`** con request, response y ejemplos.
4. Es **mergeado a `dev`** vía PR aprobado.
5. Su ticket Jira pasa a **Done**.

## 6. Estrategia de cobertura

- Medir con `npm run test:coverage` (Jest genera reporte en `coverage/`).
- Target mínimo: **70% en `src/services/` y `src/repositories/`**.
- Excluidos del target: `src/index.ts`, `src/config/*`, `src/types/*` (son bootstrap y tipos).
- Se admite cobertura menor en controllers si están bien testeados vía integración.

## 7. Roles y responsabilidades

| Rol | Responsable | Tareas de testing |
|---|---|---|
| Scrum Master | Andrei Veis | Review de PRs (incluye tests), mantener este plan, merges a `test`/`main` |
| Dev | Maximo Vendramini | Tests de los endpoints que implementa (principalmente auth DEV-18) |
| PO / Dev | Ignacio Melinc | Tests del módulo de carrito (PR #28) y productos |
| Dev | Ignacio Rodriguez | Tests asociados a Swagger/contratos |
| UX/UI | Ezequiel Lupis | Validación manual del prototipo Figma (no tests unitarios) |

## 8. Casos de prueba por flujo

### 8.1 Autenticación (DEV-18, DEV-136)

| ID | Caso | Precondición | Pasos | Resultado esperado |
|---|---|---|---|---|
| T-AUTH-01 | Registro exitoso | — | `POST /api/auth/register` con email nuevo | 201 + `{ token, user }` |
| T-AUTH-02 | Registro con email existente | Usuario ya creado | `POST /api/auth/register` mismo email | 409 |
| T-AUTH-03 | Login con credenciales válidas | Usuario registrado | `POST /api/auth/login` con creds correctas | 200 + `{ token, user }` |
| T-AUTH-04 | Login con password incorrecto | Usuario registrado | `POST /api/auth/login` password mal | 401 |
| T-AUTH-05 | Middleware sin token | — | `GET /api/users/profile` sin header | 401 |
| T-AUTH-06 | Middleware con token inválido | — | `GET /api/users/profile` con token random | 401 |

### 8.2 Perfil de usuario (DEV-159) — ✅ Implementado

| ID | Caso | Precondición | Pasos | Resultado esperado |
|---|---|---|---|---|
| T-USR-01 | GET perfil autenticado | Usuario logueado | `GET /api/users/profile` con token | 200 + `{ id, email, full_name, ... }` |
| T-USR-02 | PUT perfil parcial | Usuario logueado | `PUT` con `{ full_name: "Nuevo" }` | 200 + perfil con nuevo nombre |
| T-USR-03 | PUT con body vacío | Usuario logueado | `PUT` con `{}` | 400 |
| T-USR-04 | DELETE cuenta propia | Usuario logueado | `DELETE /api/users/profile` | 200 + `{ deleted: true }` |
| T-USR-05 | Acceso sin token | — | GET/PUT/DELETE sin auth header | 401 |

### 8.3 Productos (DEV-143, DEV-139) — ✅ Implementado

| ID | Caso | Precondición | Pasos | Resultado esperado |
|---|---|---|---|---|
| T-PROD-01 | Barcode existente | Producto cargado | `GET /api/products/barcode/7790895000782` | 200 + `{ id, name, price, ... }` |
| T-PROD-02 | Barcode inexistente | — | `GET` con barcode que no existe | 404 |
| T-PROD-03 | Sin auth | — | `GET` sin token | 401 |

### 8.4 Carrito (DEV-19, DEV-137) — Pendiente PR #28

| ID | Caso | Precondición | Pasos | Resultado esperado |
|---|---|---|---|---|
| T-CART-01 | GET carrito vacío | Usuario sin carrito | `GET /api/cart` | 200 + `{ cart: null, items: [], total: 0 }` |
| T-CART-02 | Agregar producto a carrito nuevo | Sin carrito activo | `POST /api/cart/items` con `{ productId, storeId, unitPrice }` | 201 + item |
| T-CART-03 | Agregar producto duplicado | Item ya en carrito | `POST /api/cart/items` mismo producto | 201 + quantity incrementada (upsert) |
| T-CART-04 | PUT quantity 0 | Item en carrito | `PUT /api/cart/items/:id` con `{ quantity: 0 }` | 200 + item eliminado |
| T-CART-05 | DELETE item ajeno | Item de otro usuario | `DELETE /api/cart/items/:id` | 403 |

### 8.5 Checkout (DEV-157) — ✅ Implementado

| ID | Caso | Precondición | Pasos | Resultado esperado |
|---|---|---|---|---|
| T-CHECK-01 | Checkout con carrito válido | Carrito activo con items | `POST /api/checkout` | 200 + `{ preference_id, init_point }` |
| T-CHECK-02 | Checkout sin carrito | Sin carrito activo | `POST /api/checkout` | 400 |
| T-CHECK-03 | Checkout carrito vacío | Carrito activo sin items | `POST /api/checkout` | 400 |
| T-CHECK-04 | Webhook pago aprobado | Preferencia creada | `POST /webhook` con `{ type: payment, data: { id }}` | 200 + purchase completed + cart closed |
| T-CHECK-05 | Webhook pago rechazado | Preferencia creada | Webhook con status rejected | 200 + purchase con status failed |

### 8.6 Historial (DEV-158) — ✅ Implementado

| ID | Caso | Precondición | Pasos | Resultado esperado |
|---|---|---|---|---|
| T-PURCH-01 | Listar historial | Usuario con compras | `GET /api/purchases` | 200 + array ordenado DESC |
| T-PURCH-02 | Filtrar por status | Usuario con compras mixtas | `GET /api/purchases?status=completed` | 200 + solo completed |
| T-PURCH-03 | Detalle válido | Purchase del user | `GET /api/purchases/:id` | 200 + `{ ..., items: [...] }` |
| T-PURCH-04 | Detalle ajeno | Purchase de otro user | `GET /api/purchases/:id` | 404 (ownership, no 403) |

## 9. Mapeo a tests automatizados

| Flujo | Ticket TDD | Archivo de tests | Estado |
|---|---|---|---|
| Auth | DEV-136 | `__tests__/integration/auth.test.ts` | ⏳ Pendiente implementación DEV-18 |
| Carrito | DEV-137 | `__tests__/integration/cart.test.ts` | ⏳ Pendiente PR #28 |
| Perfil de usuario | DEV-138 | `__tests__/integration/users.test.ts` | ✅ 6/6 verdes |
| Productos | DEV-139 | `__tests__/integration/products.test.ts` | ✅ 3/3 verdes |
| Purchases | DEV-140 | `__tests__/integration/purchases.test.ts` | ✅ 6/6 verdes |
| Checkout | DEV-141 | `__tests__/integration/checkout.test.ts` | ✅ 5/5 verdes |
| Health | — | `__tests__/health.test.ts` | ✅ 1/1 verde |

## 10. Estrategia de QA previo a la Entrega

1. **Automatizada:**
   - Antes de cada PR a `dev`: CI corre `npm test`. Si falla, no mergea.
   - Antes de `dev → test`: smoke test local completo (`npm test` + `npm run build`).

2. **Manual (previo a `test → main`):**
   - Desplegar `test` a Render staging (o correr local con `.env` real).
   - Recorrer los 5 flujos críticos en Swagger UI (`/api/docs`):
     - Registro → login → obtener token
     - Escanear producto (barcode real del seed)
     - Agregar al carrito + ver total
     - Checkout en MP sandbox
     - Ver historial de compras
   - Verificar en Supabase que los registros quedan consistentes.

3. **Release (post-merge a `main`):**
   - Render dispara el auto-deploy.
   - `/deploy-check` (skill interna) verifica que `/health` responde 200 en prod.
   - Tag `v0.1.0-entrega-1` en `main`.

## 11. Gestión de bugs

- Los bugs encontrados durante QA manual se abren como issues nuevos en Jira (`fix/DEV-XXX-descripcion`).
- Prioridad:
  - **Bloqueante:** rompe algún flujo del MVP → fix antes de la entrega.
  - **No bloqueante:** affectaciones cosméticas, edge cases poco probables → van a backlog post-MVP.

## 12. Referencias

- `docs/TESTING.md` — playbook de patrones de test (unit/integration/repository)
- `docs/openapi.yaml` — contrato de la API
- `CONTRIBUTING.md` — GitFlow, política de PRs, checklist que incluye tests
- `docs/ARQUITECTURA.md` — capas del backend

---

*Documento mantenido por el Scrum Master. Última actualización: 20 Abril 2026.*
