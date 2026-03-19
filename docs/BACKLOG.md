# Backlog del Proyecto ChanguiApp

**ChanguiApp — Carrito de Compras Inteligente**
UADE FAIN — Desarrollo de Aplicaciones I | Marzo 2026

---

## Épicas del Proyecto

| Épica | Descripción |
|-------|-------------|
| **Setup** | Inicialización del proyecto: repo, Jira, infraestructura, scope |
| **UX/UI** | Diseño: Figma, personas, design system, prototipos, investigación de usuarios |
| **Backend** | Servidor Node.js + Express, APIs, integración Precios Claros, Swagger |
| **Frontend** | Aplicación Android: pantallas, navegación, lógica MVVM + Repository |
| **QA/Docs** | Pruebas, documentación técnica, métricas, APK, defensa oral |

**Estimación en Story Points:** 1 = tarea simple (<2hs) · 2 = tarea pequeña · 3 = tarea media · 5 = tarea grande · 8 = tarea compleja (requiere investigación o integración)

---

## Sprint 1 — Fundaciones del Proyecto

**Período:** 19/03 → 02/04/2026
**Objetivo:** Dejar todo el andamiaje listo — repo, Jira, backend deployado, scope entregado y primeros pasos de UX.
**Total: 14 pts**

| ID | Épica | Historia de Usuario / Tarea | Pts | Prioridad | Asignado a |
|----|-------|-----|-----|-----------|-----------|
| CHNG-01 | Setup | Como equipo, necesitamos el repositorio GitHub inicializado con main, develop y CONTRIBUTING.md para comenzar a trabajar con GitFlow. | 2 | 🔴 Alta | SM |
| CHNG-02 | Setup | Como equipo, necesitamos el proyecto Jira configurado con épicas, backlog y acceso docente habilitado para gestionar el proyecto. | 2 | 🔴 Alta | SM |
| CHNG-03 | Setup | Como equipo, necesitamos el proyecto backend inicializado (Node.js + Express + estructura de carpetas) y deployado en Railway con CI básico. | 3 | 🔴 Alta | Backend Lead |
| CHNG-04 | Setup | Como equipo, necesitamos el Documento de Alcance (Scope) completado y entregado a la cátedra. | 1 | 🔴 Alta | SM |
| CHNG-05 | UX/UI | Como UX/UI Lead, necesito realizar 2-3 entrevistas a usuarios reales para validar el problema y definir las personas del proyecto. | 3 | 🔴 Alta | UX/UI Lead |
| CHNG-06 | UX/UI | Como UX/UI Lead, necesito crear el mapa de navegación y el design system básico (tipografía, colores, componentes) en Figma. | 3 | 🔴 Alta | UX/UI Lead |

---

## Sprint 2 — Prototipo Figma y Backend Auth

**Período:** 03/04 → 23/04/2026
**Objetivo:** Tener el prototipo navegable listo para mostrar a la docente y el backend de autenticación y carritos funcionando.
**Total: 20 pts**

| ID | Épica | Historia de Usuario / Tarea | Pts | Prioridad | Asignado a |
|----|-------|-----|-----|-----------|-----------|
| CHNG-07 | UX/UI | Como UX/UI Lead, necesito crear el prototipo de alta fidelidad en Figma con los 4 flujos core navegables (Auth, Carrito, Escáner, Historial). | 5 | 🔴 Alta | UX/UI Lead |
| CHNG-08 | UX/UI | Como UX/UI Lead, necesito el flujo de onboarding diseñado en Figma con al menos 3 pantallas de bienvenida. | 2 | 🟡 Media | UX/UI Lead |
| CHNG-09 | Backend | Como desarrollador, necesito implementar el endpoint de autenticación en Firebase Auth (Google Sign-In y email/contraseña) en el backend. | 3 | 🔴 Alta | Backend Lead |
| CHNG-10 | Backend | Como desarrollador, necesito implementar el CRUD completo de Carrito/Sesión de compra (crear, leer, ver historial, cerrar, eliminar). | 5 | 🔴 Alta | Backend Lead |
| CHNG-11 | Backend | Como desarrollador, necesito implementar el CRUD de ItemCarrito (agregar producto al carrito, leer items, actualizar cantidad, eliminar item). | 5 | 🔴 Alta | Backend Lead |

---

## Sprint 3 — Integración Precios Claros + Entrega 1

**Período:** 24/04 → 08/05/2026
**Objetivo:** Integrar la API de Precios Claros, completar el backend con todos los endpoints Swagger, y cerrar todos los entregables de la Entrega 1.
**Total: 23 pts**

| ID | Épica | Historia de Usuario / Tarea | Pts | Prioridad | Asignado a |
|----|-------|-----|-----|-----------|-----------|
| CHNG-12 | Backend | Como desarrollador, necesito implementar la integración con la API de Precios Claros: endpoint que reciba un barcode y devuelva nombre + precios por sucursal. | 8 | 🔴 Alta | Backend Lead |
| CHNG-13 | Backend | Como desarrollador, necesito implementar el CRUD de Producto (crear manualmente en caché, leer por barcode, actualizar precio si cambió, eliminar o expirar después de un período). | 5 | 🔴 Alta | Backend Lead |
| CHNG-14 | Backend | Como desarrollador, necesito documentar todos los endpoints del backend en Swagger con ejemplos de request/response para la Entrega 1. | 3 | 🔴 Alta | Backend Lead |
| CHNG-15 | QA/Docs | Como equipo, necesitamos el DER (Diagrama Entidad-Relación) de la base de datos diseñado y documentado. | 2 | 🔴 Alta | Tech Lead |
| CHNG-16 | QA/Docs | Como equipo, necesitamos el diagrama de arquitectura de alto nivel con descripción de tecnologías elegidas. | 2 | 🔴 Alta | Tech Lead |
| CHNG-17 | QA/Docs | Como equipo, necesitamos el plan de pruebas inicial con casos de prueba para los flujos principales del MVP. | 3 | 🔴 Alta | QA/Docs |

---

## Sprint 4 — Frontend: Auth, Carrito y Escáner

**Período:** 09/05 → 22/05/2026
**Objetivo:** Pantallas de Auth, onboarding, carrito activo y escáner de barcode funcionando en la app.
**Total: 18 pts**

| ID | Épica | Historia de Usuario / Tarea | Pts | Prioridad | Asignado a |
|----|-------|-----|-----|-----------|-----------|
| CHNG-18 | Frontend | Como usuario, quiero poder registrarme e iniciar sesión con Google o email/contraseña para acceder a mi cuenta. | 5 | 🔴 Alta | Tech Lead |
| CHNG-19 | Frontend | Como usuario, quiero ver la pantalla de onboarding al instalar la app por primera vez para entender qué hace la aplicación. | 2 | 🟡 Media | Tech Lead |
| CHNG-20 | Frontend | Como usuario, quiero poder crear un nuevo carrito de compra para iniciar una sesión de compra. | 3 | 🔴 Alta | Tech Lead |
| CHNG-21 | Frontend | Como usuario, quiero escanear el código de barras de un producto con la cámara para que se agregue automáticamente a mi carrito con su precio real. | 8 | 🔴 Alta | Tech Lead |

---

## Sprint 5 — Frontend: Features Completas y Pruebas

**Período:** 23/05 → 05/06/2026
**Objetivo:** Completar todas las features del MVP en la app y ejecutar el plan de pruebas.
**Total: 17 pts**

| ID | Épica | Historia de Usuario / Tarea | Pts | Prioridad | Asignado a |
|----|-------|-----|-----|-----------|-----------|
| CHNG-22 | Frontend | Como usuario, quiero ver el total acumulado en tiempo real mientras agrego productos al carrito para controlar mi gasto. | 3 | 🔴 Alta | Tech Lead |
| CHNG-23 | Frontend | Como usuario, quiero cargar manualmente un producto que no se encontró en la API (nombre + precio) para que siga contándose en mi total. | 3 | 🔴 Alta | Tech Lead |
| CHNG-24 | Frontend | Como usuario, quiero modificar la cantidad de un item del carrito o eliminarlo para corregir errores durante la compra. | 3 | 🔴 Alta | Tech Lead |
| CHNG-25 | Frontend | Como usuario, quiero cerrar mi compra para que quede en el historial. | 2 | 🔴 Alta | Tech Lead |
| CHNG-26 | Frontend | Como usuario, quiero ver el historial de mis compras anteriores con el detalle completo de cada sesión. | 3 | 🟡 Media | Tech Lead |
| CHNG-27 | QA/Docs | Como equipo, necesitamos ejecutar y documentar las pruebas unitarias del backend con métricas de cobertura. | 3 | 🔴 Alta | QA/Docs |

---

## Sprint 6 — Pulido, APK y Defensa

**Período:** 06/06 → 18/06/2026
**Objetivo:** Errores de conectividad, analytics, APK firmado, documentación final y ensayo de la demo.
**Total: 15 pts**

| ID | Épica | Historia de Usuario / Tarea | Pts | Prioridad | Asignado a |
|----|-------|-----|-----|-----------|-----------|
| CHNG-28 | Frontend | Como equipo, necesitamos implementar el manejo de errores de conectividad en la app (sin internet, API caída, timeout). | 3 | 🔴 Alta | Tech Lead |
| CHNG-29 | Frontend | Como equipo, necesitamos integrar analytics (capa gratuita) tanto en el backend como en la app móvil para observabilidad. | 3 | 🟡 Media | Backend Lead |
| CHNG-30 | QA/Docs | Como equipo, necesitamos generar el APK firmado e instalable en dispositivo físico. | 2 | 🔴 Alta | Tech Lead |
| CHNG-31 | QA/Docs | Como equipo, necesitamos completar la documentación técnica y de usuario final, incluyendo métricas de pruebas. | 3 | 🔴 Alta | SM |
| CHNG-32 | QA/Docs | Como equipo, necesitamos preparar la demo en vivo y el benchmark frente a la app oficial de Precios Claros para la defensa oral. | 3 | 🔴 Alta | SM |
| CHNG-33 | Backend | Como equipo, necesitamos pre-cargar 10-15 productos en el backend de producción antes de la demo final para garantizar disponibilidad. | 1 | 🔴 Alta | Backend Lead |

---

## Resumen de Sprints

| Sprint | Período | Objetivo | Pts |
|--------|---------|----------|-----|
| **1** | 19/03 → 02/04 | Fundaciones (repo, Jira, backend, scope, UX inicial) | 14 |
| **2** | 03/04 → 23/04 | Prototipo Figma + Backend Auth y Carrito | 20 |
| **3** | 24/04 → 08/05 | Integración Precios Claros + Entrega 1 | 23 |
| **4** | 09/05 → 22/05 | Frontend: Auth, Carrito, Escáner | 18 |
| **5** | 23/05 → 05/06 | Frontend: Features Completas + Pruebas | 17 |
| **6** | 06/06 → 18/06 | Pulido, APK, Documentación, Defensa | 15 |
| **TOTAL** | 19/03 → 18/06 | **33 historias, 6 épicas** | **107** |

---

## Leyenda de Prioridad

- 🔴 **Alta** — Bloqueante, crítica para el MVP
- 🟡 **Media** — Importante pero puede reprogramarse
- 🟢 **Baja** — Nice-to-have, se incluye si hay tiempo

---

*Documento elaborado: Marzo 2026 | Equipo ChanguiApp*
