# DOCUMENTO DE ALCANCE DEL PROYECTO - V.2

---

## 1. Información General del Proyecto

| Campo | Detalle |
|-------|---------|
| **Nombre del proyecto** | ChanguiApp — Carrito de Compras Inteligente |
| **Cliente / Área solicitante** | Cátedra Desarrollo de Aplicaciones I — UADE FAIN |
| **Responsable del proyecto** | Scrum Master: Andrei Veis |
| **Equipo del proyecto** | Ezequiel Lupis · Ignacio Melinc · Ignacio Rodriguez · Andrei Veis ·  Maximo Vendramini  |
| **Fecha de inicio** | 19 de Marzo de 2026 |
| **Fecha estimada de finalización** | 18 de Junio de 2026 (Entrega 2 / Segundo Parcial) |
| **Versión del documento** | 2.0 — Revisión con stack actualizado |

---

## 2. Descripción del Proyecto

ChanguiApp es una aplicación móvil que permite a consumidores argentinos realizar toda su compra de supermercado desde el celular: seleccionar el supermercado donde se encuentran, escanear productos con la cámara, armar el carrito en tiempo real, y pagar directamente desde la app mediante Mercado Pago.

El proyecto abarca el diseño UX/UI, el desarrollo de la aplicación móvil en **React Native**, y la construcción de un backend propio en **Node.js + Express** con persistencia en **Supabase** (PostgreSQL + Auth), documentado mediante Swagger y deployado en **Render**.

**Nota sobre la demo:** En un escenario real, la app se conectaría a los servidores internos de cada supermercado para obtener precios y stock. Para el TP, se utiliza la API pública de Precios Claros (SEPA, gobierno argentino) como fuente de datos simulada. La lista de supermercados disponibles se obtiene de esta misma API. Esto permite demostrar el flujo completo con precios reales sin necesidad de convenios con cadenas de supermercados.

---

## 3. Objetivos del Proyecto

### Objetivo General

Desarrollar una aplicación móvil funcional que resuelva la fricción del proceso de compra en supermercados argentinos (filas en caja, desconocimiento del total), aplicando buenas prácticas de arquitectura, diseño centrado en el usuario, pruebas e integración continua.

### Objetivos Específicos

- Implementar un flujo completo de Scan & Go: seleccionar supermercado → escanear productos → carrito → pagar con Mercado Pago.
- Integrar Mercado Pago como pasarela de pagos real (modo sandbox/test para el TP).
- Utilizar la API de Precios Claros (SEPA) como fuente de datos simulada para obtener precios reales de productos.
- Diseñar e implementar una arquitectura MVVM + Repository tanto en el frontend (React Native) como en el backend (Node.js + Express + capa de repositorios).
- Proveer autenticación segura mediante **Supabase Auth** (Google Sign-In y email/contraseña).
- Cubrir los 3 CRUDs obligatorios del TP: **Items de Carrito**, **Productos (lectura por barcode + caché)** y **Compras/Historial**.
- Persistir datos en **Supabase** (PostgreSQL) con caché de productos consultados.
- Alcanzar un cold start inferior a 2,5 segundos y un manejo robusto de errores de conectividad.
- Entregar prototipo navegable de alta fidelidad en Figma con Material Design 3 y heurísticas de Nielsen evidenciadas.
- Documentar todos los endpoints del backend con Swagger (Entrega 1) y presentar una defensa técnica con demo en vivo (Entrega 2).

---

## 4. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend (Mobile)** | React Native |
| **Patrón de arquitectura** | MVVM + Repository |
| **Backend** | Node.js + Express (deploy en Render) |
| **Base de datos** | Supabase (PostgreSQL hosted) |
| **Autenticación** | Supabase Auth (Google Sign-In + email/contraseña) |
| **Pasarela de pagos** | Mercado Pago SDK (modo sandbox/test) |
| **API de precios (demo)** | Precios Claros / SEPA (gobierno argentino) |
| **Documentación API** | Swagger |
| **Control de versiones** | Git + GitHub (GitFlow) |
| **Gestión del proyecto** | Jira (Scrum) |

---

## 5. Endpoints del Backend

### Autenticación y Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario (crear cuenta via Supabase Auth) |
| POST | `/api/auth/login` | Login / Autenticación |
| GET | `/api/users/profile` | Obtener perfil del usuario |
| PUT | `/api/users/profile` | Actualizar datos de perfil |

### Productos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products/barcode/:code` | Consultar producto por código de barras (API Precios Claros + caché en Supabase) |

### Supermercados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/stores` | Listar supermercados disponibles (hardcodeados de API Precios Claros) |

### Carrito

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/cart` | Ver contenido del carrito activo (subtotales y lista de items) |
| POST | `/api/cart/items` | Agregar producto al carrito |
| PUT | `/api/cart/items/:id` | Actualizar cantidad de un producto |
| DELETE | `/api/cart/items/:id` | Quitar un producto del carrito |
| DELETE | `/api/cart` | Vaciar/cancelar el carrito completo |

### Pagos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/checkout` | Iniciar pago: genera preferencia de Mercado Pago y devuelve datos para checkout in-app |
| POST | `/api/checkout/webhook` | Webhook de Mercado Pago para confirmar estado del pago |

### Historial de Compras

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/purchases` | Listar historial de compras del usuario |
| GET | `/api/purchases/:id` | Ver detalle de una compra pasada |

### Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Healthcheck |

---

## 6. CRUDs del Proyecto

### CRUD 1: Items de Carrito
| Operación | Endpoint | Descripción |
|-----------|----------|-------------|
| **Create** | `POST /api/cart/items` | Agregar producto escaneado al carrito |
| **Read** | `GET /api/cart` | Ver carrito activo con lista de items y subtotales |
| **Update** | `PUT /api/cart/items/:id` | Actualizar cantidad de un item |
| **Delete** | `DELETE /api/cart/items/:id` | Eliminar item del carrito |

### CRUD 2: Productos (lectura por barcode + caché)
| Operación | Endpoint | Descripción |
|-----------|----------|-------------|
| **Create** | (automático) | Al consultar un barcode, el producto se cachea en Supabase |
| **Read** | `GET /api/products/barcode/:code` | Consultar producto por barcode (busca en caché, si no está consulta Precios Claros) |
| **Update** | (automático) | Si el precio cambió en Precios Claros, se actualiza el caché |
| **Delete** | (automático) | Productos cacheados expiran después de un período configurable |

### CRUD 3: Compras / Historial
| Operación | Endpoint | Descripción |
|-----------|----------|-------------|
| **Create** | `POST /api/checkout` | Se crea el registro de compra al iniciar el pago |
| **Read** | `GET /api/purchases` y `GET /api/purchases/:id` | Listar historial y ver detalle de una compra |
| **Update** | (via webhook) | El estado de la compra se actualiza cuando Mercado Pago confirma el pago |
| **Delete** | — | Las compras no se eliminan (son registros históricos) |

---

## 7. Alcance del Proyecto (In Scope)

### Funcionalidades incluidas en el MVP

- Registro y login de usuarios (email/contraseña y Google Sign-In via Supabase Auth)
- Flujo de onboarding inicial en la primera apertura de la app
- Selección del supermercado donde se encuentra el usuario (lista hardcodeada desde Precios Claros)
- Escaneo de código de barras con la cámara del dispositivo
- Consulta de precios via API de Precios Claros (simulando servidores del supermercado)
- Carrito de compras persistente (se mantiene activo aunque el usuario cierre la app; solo se cierra al pagar o cancelar manualmente)
- Total acumulado en tiempo real mientras se agregan productos
- Pago in-app mediante Mercado Pago (modo sandbox/test, checkout integrado dentro de la app)
- Historial de compras anteriores con detalle por sesión
- Caché de productos consultados en Supabase (reducción de latencia y resiliencia ante fallas de la API)
- Backend propio en Node.js + Express con documentación Swagger, deployado en Render
- Persistencia y autenticación en Supabase (PostgreSQL + Auth)
- Observabilidad con analytics en capa gratuita (backend y app)

### Entregables técnicos obligatorios

- **Entrega 1:** Figma, flujo de pantallas, repositorio inicializado con GitFlow, tablero Jira con acceso docente, DER, plan de pruebas, diagrama de arquitectura, Swagger con todos los endpoints funcionando
- **Entrega 2:** APK funcional, documentación de pruebas y métricas, documentación técnica y de usuario, defensa oral con demo en vivo (20 min + 5 min Q&A)

---

## 8. Fuera de Alcance (Out of Scope)

- Versión iOS de la aplicación
- Conexión con servidores reales de supermercados (se simula con Precios Claros)
- Comparador de precios entre sucursales / supermercados
- Listas de compras inteligentes y optimizador de supermercados
- Consulta de stock y ubicación física (pasillo, góndola, sector)
- Carga manual de productos no encontrados en la API (se evaluará post-MVP)
- Gestión de métodos de pago propia (se delega a Mercado Pago)
- Comprobante QR de salida (el pago confirmado sirve como comprobante)
- Carrito colaborativo o sincronización entre múltiples dispositivos
- Modo offline con cola de tareas
- Presupuesto inteligente con alertas de límite de gasto
- Integración con Open Food Facts para datos nutricionales
- Publicación en Google Play Store
- Soporte para versiones de Android anteriores al API Level mínimo definido por el equipo
- Internacionalización (soporte multilenguaje)

---

## 9. Entregables del Proyecto

| Entregable | Descripción | Fecha estimada |
|------------|-------------|----------------|
| Documento de Alcance | Scope Statement v2.0 | 19/03/2026 |
| Prototipo Figma | Wireframes de alta fidelidad, design system, mapa de navegación, personas y journeys | ~30/04/2026 |
| Repositorio GitHub | Repos Frontend + Backend inicializados con GitFlow, CONTRIBUTING.md | 19/03/2026 |
| Tablero Jira | Proyecto Scrum con backlog, sprints y acceso docente habilitado | 19/03/2026 |
| DER | Diagrama Entidad-Relación (Usuario, Carrito, ItemCarrito, Producto, Compra) | ~30/04/2026 |
| Plan de pruebas | Documento con casos de prueba unitarias y de integración | ~30/04/2026 |
| Diagrama de arquitectura | Diagrama de alto nivel con descripción de tecnologías | ~30/04/2026 |
| Backend + Swagger (Entrega 1) | Todos los endpoints REST funcionando y documentados, deploy en Render + Supabase | ~30/04/2026 |
| APK + App completa (Entrega 2) | Aplicación React Native funcional con todas las features del MVP | ~18/06/2026 |
| Documentación final | Docs técnica y de usuario, métricas, pruebas ejecutadas, Release Candidate | ~18/06/2026 |
| Defensa oral | Demo en vivo 20 min + Q&A 5 min, benchmark vs app similar | ~18/06/2026 |

---

## 10. Sprints del Proyecto

El backlog detallado con todas las historias de usuario, story points, prioridades y asignaciones está disponible en:

📋 **[BACKLOG.md](./docs/BACKLOG.md)**

**Resumen:**
- **Total: 107 story points en 6 sprints | 33 historias**
- **Épicas:** Setup · UX/UI · Backend · Frontend · QA/Docs
- **Período:** 19/03/2026 → 18/06/2026
- **Entregas:** Entrega 1 (Sprint 1-3, ~30/04) · Entrega 2 (Sprint 4-6, ~18/06)

---

## 11. Supuestos

- La API de Precios Claros (SEPA) permanece operativa durante el desarrollo del proyecto.
- Mercado Pago SDK en modo sandbox permite testear el flujo completo sin cobros reales. Se usan tarjetas de prueba provistas por Mercado Pago.
- Los cuatro integrantes del equipo cuentan con disponibilidad para sprints quincenales.
- El equipo tiene acceso a dispositivos Android físicos o emuladores para pruebas.
- Supabase en capa gratuita (Auth + PostgreSQL) ofrece disponibilidad suficiente para las demos y entregas.
- Render en capa gratuita es suficiente para hostear el backend durante el proyecto.

---

## 12. Restricciones

- Tecnología frontend: React Native (según decisión del equipo).
- El proyecto debe cumplir con el cronograma: Entrega 1 ~30/04/2026 y Entrega 2 ~18/06/2026.
- Presupuesto cero: todos los servicios deben operar en capa gratuita (Supabase, Render, Mercado Pago sandbox).
- El backend debe estar documentado con Swagger para la Entrega 1.
- La app debe implementar el patrón MVVM + Repository.
- La API de Precios Claros puede cambiar su estructura sin previo aviso — se mitiga con caché en Supabase.
- Cold start de la app debe ser inferior a 2,5 segundos.
- Mercado Pago se usa exclusivamente en modo sandbox/test — no se procesan cobros reales.
- El carrito es persistente: se mantiene activo entre sesiones de la app, solo se cierra al pagar o cancelar manualmente.

---

## 13. Criterios de Aceptación

### Entrega 1 (Sprint 1-3, ~30/04/2026)

- El prototipo Figma es navegable y cubre los 4 flujos core (Auth, Escáner, Carrito, Pago/Historial).
- El repositorio GitHub está inicializado con GitFlow y CONTRIBUTING.md.
- El tablero Jira tiene el backlog completo con sprints configurados y acceso docente.
- El DER representa correctamente las entidades: Usuario, Carrito, ItemCarrito, Producto, Compra.
- Todos los endpoints del backend responden correctamente y están documentados en Swagger.
- La integración con la API de Precios Claros devuelve precios reales a partir de un barcode válido.
- La integración con Mercado Pago en sandbox procesa un pago de prueba exitosamente.
- El backend está deployado en Render y conectado a Supabase.

### Entrega 2 (Sprint 4-6, ~18/06/2026)

- La aplicación React Native está completamente funcional cubriendo los 3 CRUDs (Items de Carrito, Productos/Barcode, Compras/Historial).
- La autenticación con Supabase Auth funciona correctamente (Google Sign-In y email/contraseña).
- El escaneo de barcode recupera el precio real del producto en menos de 3 segundos.
- El botón "Pagar" abre el checkout de Mercado Pago in-app y procesa el pago en sandbox.
- El carrito se mantiene activo si el usuario cierra la app, y se cierra solo al pagar o cancelar.
- El cold start es inferior a 2,5 segundos.
- La app maneja correctamente errores de conectividad con mensajes adecuados.
- Se entrega APK firmado e instalable en dispositivo Android físico.
- La defensa oral incluye demo en vivo y benchmark frente a al menos una app similar.

---

*Documento elaborado por el equipo — Marzo 2026 | UADE Desarrollo de Aplicaciones I*
