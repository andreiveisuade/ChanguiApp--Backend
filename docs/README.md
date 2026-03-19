# Documentación — ChanguiApp

**Documentación centralizada del proyecto ChanguiApp**

---

## 📋 Índice de Documentos

### Gestión del Proyecto

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [Scope_ChanguiApp.md](../Scope_ChanguiApp.md) | Documento de Alcance v2.0 — Objetivos, stack, endpoints, alcance, restricciones | ✅ Entrega 1 |
| [BACKLOG.md](./BACKLOG.md) | Backlog detallado — 6 sprints, 33 historias, 107 story points | ✅ Marzo 2026 |

### Planificación y Arquitectura

| Documento | Descripción | Responsable | Fecha estimada |
|-----------|-------------|-------------|-----------------|
| DER (Diagrama Entidad-Relación) | Schema de base de datos: Usuario, Carrito, ItemCarrito, Producto, Compra | Tech Lead | ~30/04/2026 |
| Diagrama de Arquitectura | Arquitectura de alto nivel: frontend, backend, APIs externas, bases de datos | Tech Lead | ~30/04/2026 |
| Plan de Pruebas | Casos de prueba unitarios, integración y E2E con cobertura | QA/Docs | ~30/04/2026 |

### Documentación Técnica

| Documento | Descripción | Ubicación | Estado |
|-----------|-------------|-----------|--------|
| Swagger / OpenAPI | Documentación interactiva de todos los endpoints del backend | `/src/swagger.json` | Por generar (Sprint 3) |
| README Backend | Setup, instalación, variables de entorno, cómo correr | `../README.md` | ✅ Iniciado |
| CONTRIBUTING.md | Guía de contribución, branching strategy (GitFlow), convenciones | `../CONTRIBUTING.md` | ✅ Entrega 1 |

---

## 📑 Resumen del Scope

**Proyecto:** ChanguiApp — Carrito de Compras Inteligente
- **Equipo:** Ezequiel Lupis · Ignacio Melinc · Ignacio Rodriguez · Andrei Veis · Máximo Vendramini
- **Scrum Master:** Andrei Veis
- **Período:** 19/03/2026 → 18/06/2026
- **Stack:** React Native (Frontend) · Node.js + Express (Backend) · Supabase (PostgreSQL + Auth)

**Objetivo General:** Desarrollar una aplicación móvil funcional que permita escanear productos de supermercado, armar carrito en tiempo real, y pagar con Mercado Pago.

**CRUDs del MVP:**
1. Items de Carrito (Create, Read, Update, Delete)
2. Productos (lectura por barcode + caché)
3. Compras / Historial

---

## 🎯 Entregas Hito

### Entrega 1 (Sprint 1-3, ~30/04/2026)
- ✅ Figma con prototipo navegable (4 flujos core)
- ✅ Backend con todos los endpoints documentados en Swagger
- ✅ Integración API Precios Claros + Mercado Pago sandbox
- ✅ DER + Diagrama de Arquitectura
- ✅ Plan de Pruebas
- ✅ Repositorio GitHub con GitFlow + acceso docente en Jira

### Entrega 2 (Sprint 4-6, ~18/06/2026)
- ✅ APK funcional instalable en dispositivo Android físico
- ✅ App React Native con todos los features del MVP
- ✅ Documentación técnica y de usuario
- ✅ Defensa oral: demo en vivo + benchmark vs Precios Claros oficial

---

## 📊 Progreso de Sprints

| Sprint | Período | Tema | Story Points | Estado |
|--------|---------|------|--------------|--------|
| 1 | 19/03 → 02/04 | Fundaciones | 14 | 🔴 Activo |
| 2 | 03/04 → 23/04 | Prototipo Figma + Backend Auth | 20 | ⏳ Próximo |
| 3 | 24/04 → 08/05 | Integración Precios Claros + Entrega 1 | 23 | ⏳ Próximo |
| 4 | 09/05 → 22/05 | Frontend: Auth, Carrito, Escáner | 18 | ⏳ Próximo |
| 5 | 23/05 → 05/06 | Frontend: Features Completas + Pruebas | 17 | ⏳ Próximo |
| 6 | 06/06 → 18/06 | Pulido, APK y Defensa | 15 | ⏳ Próximo |
| **TOTAL** | **19/03 → 18/06** | **6 sprints** | **107 pts** | |

---

## 🔗 Enlaces Rápidos

**Repositorios:**
- Backend: `ChanguiApp--Backend` (este proyecto)
- Frontend: `ChanguiApp--Frontend` (React Native)
- Docs: En `/docs` del backend

**Herramientas:**
- Jira: [ChanguiApp Project](https://uade-dev.atlassian.net/jira/software/c/projects/CHNG/board)
- Figma: [ChanguiApp Design System](https://www.figma.com/...)
- Backend Deploy: Render
- Autenticación: Supabase

**APIs Externas:**
- Precios Claros (SEPA): `https://d3e6htiiul5ek9.cloudfront.net/prod`
- Mercado Pago SDK: Modo sandbox/test
- Supabase: PostgreSQL + Auth gratuita

---

## ❓ Preguntas Frecuentes

**¿Cómo empiezo?**
1. Clona el repo
2. Instala dependencias: `npm install`
3. Copia `.env.example` a `.env`
4. Lee `CONTRIBUTING.md` para GitFlow
5. Levanta el server: `npm run dev`

**¿Dónde veo el backlog?**
→ [BACKLOG.md](./BACKLOG.md)

**¿Cuál es el endpoint base?**
→ Ver [Scope_ChanguiApp.md](../Scope_ChanguiApp.md) sección "Endpoints del Backend"

**¿Cómo documentar un endpoint nuevo?**
→ Agrega a Swagger/OpenAPI en Sprint 3. Mientras tanto, documenta en comentarios.

---

*Última actualización: 19/03/2026 | Equipo ChanguiApp*
