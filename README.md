# ChanguiApp — Backend

API REST en Node.js + Express para ChanguiApp — Carrito de Compras Inteligente.
Integra la API de Precios Claros (SEPA) del gobierno argentino para obtener precios reales de productos de supermercado, con autenticación via Supabase Auth y persistencia en PostgreSQL.

---

## 📋 Documentación Centralizada

**Toda la documentación del proyecto está en `/docs`:**

- 📑 **[Documentación Index](./docs/README.md)** — Punto de entrada a toda la documentación
- 📋 **[Scope del Proyecto](./Scope_ChanguiApp.md)** — Alcance v2.0, objetivos, stack, endpoints, CRUDs
- 📊 **[Backlog Detallado](./docs/BACKLOG.md)** — 6 sprints, 33 historias, 107 story points

---

## ⚡ Quickstart

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env (copiar .env.example)
cp .env.example .env

# 3. Levantar servidor en desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

---

## 🏗️ Stack

| Capa | Tecnología | Descripción |
|------|-----------|-------------|
| **Runtime** | Node.js >= 18 | JavaScript en servidor |
| **Framework** | Express | Web server y routing |
| **BD** | Supabase (PostgreSQL) | Autenticación + persistencia |
| **Auth** | Supabase Auth | Google Sign-In + email/contraseña |
| **APIs Externas** | Precios Claros (SEPA) | Precios de productos (gobierno AR) |
| **Pagos** | Mercado Pago SDK | Pasarela de pagos (sandbox) |
| **Docs** | Swagger / OpenAPI | Documentación interactiva (Sprint 3) |
| **Deploy** | Render | Hosting gratuito |

---

## 📚 Arquitectura

```
backend/
├── src/
│   ├── controllers/      # Controladores (request/response)
│   ├── services/        # Lógica de negocio
│   ├── repositories/    # Acceso a datos (DB, caché, APIs externas)
│   ├── models/          # Esquemas de datos
│   ├── routes/          # Rutas HTTP
│   └── middleware/      # Middlewares (auth, error, etc.)
├── docs/
│   ├── BACKLOG.md       # Backlog del proyecto
│   └── README.md        # Índice de documentación
└── Scope_ChanguiApp.md  # Documento de alcance
```

**Patrón:** MVVM (Model-View-ViewModel) + Repository Pattern

---

## 🔑 Variables de Entorno

```env
# Servidor
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=TEST-...

# Precios Claros (API pública, sin key necesaria)
PRECIOS_CLAROS_BASE_URL=https://d3e6htiiul5ek9.cloudfront.net/prod
```

---

## 🌐 Endpoints Principales

Ver documentación completa en [Scope_ChanguiApp.md](./Scope_ChanguiApp.md#5-endpoints-del-backend)

### Ejemplos Rápidos

```bash
# Healthcheck
curl http://localhost:3000/health

# Obtener supermercados cercanos
curl "http://localhost:3000/api/stores?lat=-34.6037&lng=-58.3816"

# Consultar producto por barcode
curl "http://localhost:3000/api/products/barcode/7790040116909?lat=-34.6037&lng=-58.3816"
```

---

## 👥 Equipo

| Integrante | Rol |
|------------|-----|
| Andrei Veis | Scrum Master |
| Ezequiel Lupis | Backend Lead |
| Ignacio Melinc | Frontend Lead |
| Ignacio Rodriguez | QA/Tech Lead |
| Máximo Vendramini | UX/UI Lead |

---

## 🔗 Links Rápidos

- 📱 **Frontend:** [ChanguiApp--Frontend](https://github.com/andreiveisuade/ChanguiApp--Frontend)
- 📊 **Jira:** ChanguiApp Project (UADE Desarrollo de Aplicaciones)
- 📑 **Documentación:** [/docs/README.md](./docs/README.md)
- 🎨 **Figma:** [ChanguiApp Design System](...)

---

UADE — Desarrollo de Aplicaciones I — 2026
