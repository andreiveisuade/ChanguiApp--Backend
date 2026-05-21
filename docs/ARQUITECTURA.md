# Arquitectura de ChanguiApp

## 1. Vision general del sistema

ChanguiApp se compone de una app mobile en React Native (TypeScript), un backend REST en Node.js + Express con **TypeScript** desplegado en Render y Supabase como plataforma de datos, autenticacion y persistencia. El backend actua como punto central de integracion entre la app, la base PostgreSQL y los servicios externos.

> **Lenguaje del backend:** el backend migro de JavaScript a TypeScript en DEV-160. `tsconfig.json` usa `strict: true` y los tests corren con `ts-jest`. Todo archivo nuevo en `src/` y `__tests__/` se escribe en `.ts`.

```text
┌──────────┐    HTTPS     ┌──────────────┐    SQL     ┌──────────┐
│  React   │ ──────────── │   Express    │ ────────── │ Supabase │
│  Native  │   REST API   │   (Render)   │            │ Postgres │
│  (App)   │              │              │            │  + Auth  │
└──────────┘              └──────┬───────┘            └──────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────┴─────┐ ┌───┴────┐ ┌─────┴──────┐
              │  Precios  │ │Mercado │ │  Supabase  │
              │  Claros   │ │ Pago   │ │   Auth     │
              │  (sync)   │ │ (SDK)  │ │  (Google)  │
              └───────────┘ └────────┘ └────────────┘
```

Precios Claros se consume via cron job de sincronizacion masiva hacia Supabase; no se llama en runtime al momento del escaneo de productos.

En el backend, `src/index.ts` concentra el bootstrap de Express (monta rutas, sirve Swagger UI en `/api/docs`, registra error handler global), mientras que `src/config/supabase.ts` centraliza la creacion del cliente de Supabase tipado. La separacion por capas esta materializada en la estructura de carpetas de `src/`.

## 2. Arquitectura del backend — Controller → Service → Repository

El backend sigue una arquitectura por capas donde Express recibe requests, los controllers interpretan la entrada, los services resuelven la logica de negocio y los repositories encapsulan el acceso a datos.

```text
┌─────────────────────────────────────────┐
│            ROUTES (Express)             │
│  /api/auth, /api/cart, /api/lists,      │
│  /api/products, /api/checkout, etc.     │
│  Solo recibe request y llama controller.│
├─────────────────────────────────────────┤
│           CONTROLLERS                   │
│  Valida input, orquesta la lógica,      │
│  devuelve response con status code.     │
├─────────────────────────────────────────┤
│            SERVICES                     │
│  Lógica de negocio pura.                │
│  No sabe nada de HTTP ni de Supabase.   │
├─────────────────────────────────────────┤
│           REPOSITORIES                  │
│  Única capa que habla con Supabase.     │
│  Queries SQL, inserts, updates.         │
│  No tiene lógica de negocio.            │
└─────────────────────────────────────────┘
```

### Responsabilidad de carpetas del backend

- `src/routes/`: define endpoints de Express y delega cada request al controller correspondiente.
- `src/controllers/`: adapta el request HTTP al caso de uso. Extrae params, body y headers, valida la entrada, llama al service y arma la respuesta HTTP.
- `src/services/`: concentra la logica de negocio de la aplicacion. Decide reglas, validaciones funcionales y orquestacion entre repositorios o integraciones.
- `src/repositories/`: encapsula el acceso a datos. Es la unica capa que debe ejecutar lecturas y escrituras sobre Supabase/Postgres.
- `src/middleware/`: contiene preocupaciones transversales de Express, por ejemplo autenticacion, autorizacion, manejo de errores, logging o validaciones reutilizables.
- `src/config/`: agrupa configuracion tecnica compartida (`supabase.ts`, `mercadopago.ts`) creando y exportando los clientes usando variables de entorno.
- `src/types/`: tipos compartidos entre capas (entidades de dominio, DTOs, respuestas de API).

### Regla de dependencia

**Regla explicita:** el Controller nunca llama al Repository directamente. Siempre pasa por el Service.

Esto mantiene desacoplada la logica de negocio del transporte HTTP y evita que la capa web conozca detalles de persistencia.

## 3. Arquitectura del frontend — MVVM + Repository

El frontend mobile se organiza con MVVM para separar la UI de la logica de presentacion y de las llamadas al backend. Aunque este repositorio corresponde al backend, esta es la estructura objetivo esperada para el cliente React Native (TypeScript).

```text
┌─────────────────────────────────────────┐
│              VIEW (Screens)             │
│  Pantallas: Login, Scanner, Cart,       │
│  Lists, History, Profile                │
│  Solo renderiza UI. No tiene lógica.    │
├─────────────────────────────────────────┤
│            VIEWMODEL (Hooks)            │
│  useCart(), useScanner(), useLists()    │
│  Maneja estado, validaciones, lógica    │
│  de presentación. Llama al Repository. │
├─────────────────────────────────────────┤
│           REPOSITORY (Services)         │
│  CartRepository, ListRepository,        │
│  AuthRepository, ProductRepository      │
│  Única capa que habla con el backend.   │
│  Abstrae las llamadas HTTP (axios/fetch)│
└─────────────────────────────────────────┘
```

### Responsabilidad de carpetas del frontend

- `src/screens/`: implementa las pantallas de la app. Solo compone componentes y renderiza estado.
- `src/viewmodels/`: define hooks y adaptadores de presentacion, por ejemplo `useCart`, `useScanner` o `useLists`, que administran estado, side effects y validaciones de UI.
- `src/repositories/`: concentra las llamadas HTTP al backend y abstrae detalles de `fetch` o `axios`.
- `src/components/`: guarda componentes reutilizables de interfaz, como cards, inputs, headers, modales o botones.
- `src/navigation/`: centraliza la configuracion de React Navigation, stacks, tabs, guards y flujos de navegacion.
- `src/i18n/`: contiene configuracion de internacionalizacion, diccionarios y utilidades de traduccion.
- `src/utils/`: aloja helpers genericos y funciones compartidas que no pertenecen a una feature puntual.

### Regla de dependencia

**Regla explicita:** la View nunca llama al Repository directamente. Siempre pasa por el ViewModel.

Esto evita mezclar renderizado con acceso a datos y permite que la UI sea mas facil de testear y mantener.

## 4. Flujo end-to-end: "Usuario escanea un producto"

El siguiente flujo muestra como deberia atravesar todas las capas cuando el usuario escanea un codigo de barras desde la app:

```text
[App] Usuario escanea el código de barras
  → View (ScannerScreen) detecta el código
  → ViewModel (useScanner) llama a ProductRepository.getByBarcode(code)
  → Repository hace GET /api/products/barcode/:code al backend

  → [Backend] Route recibe el request
  → Controller extrae el param y llama a productService.getByBarcode(code)
  → Service llama a productRepository.findByBarcode(code)
  → Repository ejecuta SELECT en tabla products de Supabase

  → La respuesta sube por las capas hasta la View
  → ViewModel actualiza el estado con el producto encontrado
  → View renderiza nombre, marca y precio del producto
```

En este flujo, la app nunca consulta Precios Claros en tiempo real. El lookup del producto ocurre contra la informacion ya sincronizada y persistida en Supabase.

## 5. Estructura de carpetas

### Backend — estructura real actual de `src/`

La estructura actual del backend en este repositorio es la siguiente:

```text
src/
├── config/           # Clientes tipados: supabase, mercadopago
├── controllers/      # Validación de input y respuestas HTTP (.ts)
├── middleware/       # Autenticación JWT y manejo de errores (.ts)
├── repositories/     # Queries a Supabase (.ts)
├── routes/           # Definición de endpoints Express (.ts)
├── services/         # Lógica de negocio (.ts)
├── types/            # Tipos compartidos (entidades, DTOs)
├── utils/            # Helpers genéricos
└── index.ts          # Bootstrap de Express + Swagger UI
```

Observaciones sobre el estado actual:

- `src/index.ts` inicializa Express, registra `cors`, `express.json()`, monta las rutas del MVP, sirve Swagger UI en `/api/docs` y registra el error handler global.
- La compilación de TypeScript se hace con `npm run build` (`tsc`) y la ejecución en dev con `npm run dev` (`tsx watch`).

### Frontend — estructura objetivo

```text
src/
├── screens/          # View (pantallas)
├── viewmodels/       # ViewModel (hooks: useCart, useLists, etc.)
├── repositories/     # Repository (llamadas HTTP al backend)
├── components/       # Componentes reutilizables de UI
├── navigation/       # React Navigation config
├── i18n/             # Internacionalización
└── utils/            # Helpers genéricos
```

Esta estructura apunta a que tanto backend como frontend sigan reglas de dependencia claras, con capas bien definidas y responsabilidades simples de razonar para todo el equipo.

<!-- DEV-25 -->

## 6. Sincronizacion con Precios Claros

El catalogo de productos se mantiene en la tabla `products` de Supabase. Para poblarlo se sincroniza periodicamente desde la API publica de Precios Claros (SEPA), que expone los precios de las sucursales relevadas en Argentina. La app nunca llama a Precios Claros en runtime: la consulta por codigo de barras se resuelve siempre contra Supabase.

### 6.1 Motivacion del diseno async

La sucursal del MVP (`12-1-158`, Coto Charcas) tiene mas de 8000 productos en Precios Claros. Sincronizar todos en una sola request HTTP era inviable porque:

- Render free tier corta requests largas a ~168 segundos, devolviendo HTTP 502.
- El cliente HTTP (curl, GitHub Actions) tenia que mantenerse esperando ~25 minutos.
- Si fallaba a mitad de camino no habia forma de saber donde habia quedado.

Por eso el endpoint admin se rediseno en DEV-164 como **fire-and-forget con estado persistido**: la request HTTP devuelve casi inmediatamente con un identificador, y el trabajo real corre en background dejando huella en una tabla operativa.

### 6.2 Componentes

- **POST `/api/admin/sync-precios-claros`**: crea un registro en `sync_jobs`, dispara el runner en background y devuelve **HTTP 202** con `{ sync_id }` en menos de un segundo. Si ya hay un sync en estado `running`, responde **HTTP 409** y no arranca otro.
- **GET `/api/admin/sync-precios-claros/:id`**: devuelve el estado del job (status, processed, errors, last_offset, started_at, completed_at).
- **Middleware `requireAdminToken`** (`src/config/adminAuth.ts`): protege ambos endpoints con header `X-Admin-Token`.
- **Tabla `sync_jobs`** en Supabase: una fila por cada corrida del sync. Estados posibles: `queued`, `running`, `completed`, `failed`. Schema en `db/schema.sql`.
- **`sync.service.ts`** (`src/services/`): orquesta el runner. Detecta el `total` de productos con una primera call `limit=1`, luego itera paginando de a `PAGE_LIMIT=100`, y aplica `await sleep(SYNC_DELAY_MS)` entre paginas para no saturar ni a Precios Claros ni al server.
- **`product.repository.ts.upsertBatch`**: una unica query `INSERT ... ON CONFLICT (barcode)` por bloque de 100 productos. Reduce de ~16000 queries (una por producto) a ~80 queries por corrida.
- **GitHub Actions** (`.github/workflows/cron-sync.yml`): cron diario a las 09:00 UTC (06:00 ART) + `workflow_dispatch` para disparo manual. Hace `curl POST` al endpoint admin usando los secrets `BACKEND_URL` y `ADMIN_TOKEN`.

### 6.3 Flujo end-to-end

```text
[GitHub Actions / Admin]
  → POST /api/admin/sync-precios-claros (X-Admin-Token)
  → Backend: requireAdminToken middleware → controller
  → Service: ¿hay sync running? Si → 409. No → INSERT sync_jobs (status=running)
  → Response: 202 { sync_id }
  → Service dispara runPreciosClarosSync(jobId) sin await (fire-and-forget)

  [Background runner — ya corriendo en paralelo]
  → fetch Precios Claros (limit=1) → leer total
  → UPDATE sync_jobs SET total_target = total
  → loop while offset < total:
       fetch Precios Claros (limit=100, offset=offset)
       productRepository.upsertBatch(productos)
       UPDATE sync_jobs SET processed, last_offset, errors
       await sleep(SYNC_DELAY_MS)
  → UPDATE stores SET synced_at = NOW() WHERE precios_claros_id = ...
  → UPDATE sync_jobs SET status=completed, completed_at=NOW()

[Cliente que quiera ver progreso]
  → GET /api/admin/sync-precios-claros/:sync_id
  → Backend: requireAdminToken → controller → repository.findById
  → Response: 200 con la fila completa de sync_jobs, o 404 si no existe
```

### 6.4 Idempotencia y resiliencia

- **No corren dos syncs en paralelo**: el chequeo `findRunning(type)` antes de crear un job nuevo garantiza que solo hay uno activo a la vez. Si el cron diario se dispara mientras alguien hizo un sync manual, el segundo recibe 409 y no compite.
- **No se duplican productos**: el constraint `UNIQUE (barcode)` en `products` + el `ON CONFLICT (barcode)` del upsert hacen que sucesivas corridas converjan al mismo estado, sin importar cuantas veces se sincronice.
- **Estado siempre consultable**: cualquier falla queda registrada en `sync_jobs.error_message` con `status=failed`. No hay procesos zombi que solo vivan en memoria del container.
- **Tolerancia a errores parciales**: si el upsert de un batch falla, se cuenta en `errors` y el sync continua con el siguiente batch en lugar de abortar todo.

### 6.5 Configurabilidad

- `SYNC_DELAY_MS` (env var): delay entre paginas de Precios Claros. Default **2000ms**. Sirve doble proposito: respetar la API publica y dejar tiempo al event loop de Node para atender otras requests mientras el sync corre. Con valores muy bajos (~300ms) el backend en Render free tier puede empezar a responder 503 a otras requests durante el sync.
- `MVP_STORE_PRECIOS_CLAROS_ID` (env var): sucursal a sincronizar.
- `PRECIOS_CLAROS_URL` (env var): base URL de la API. En dev se puede apuntar a una URL muerta (por ejemplo `http://10.255.255.1`) para hacer smoke del flujo de endpoints sin escribir productos reales: el runner arranca, falla rapido, marca `failed`, y no toca `products`.

<!-- DEV-164 -->
