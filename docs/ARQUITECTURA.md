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
