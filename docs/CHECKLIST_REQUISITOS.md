# Checklist de Requisitos del TP — ChanguiApp

**Verificación de alineación con el documento oficial del TP**

---

## ✅ ENTREGA 1 (Obligatoria) — ~30/04/2026

### Requisitos Explícitos en el TP

| Requisito | Status | Backlog | Sprint | Notas |
|-----------|--------|---------|--------|-------|
| Figma + flujo de pantallas | ✅ | CHNG-07 | 2 | Prototipo navegable con 4 flujos |
| Repositorio inicializado + GitFlow | ✅ | CHNG-01 | 1 | GitHub + CONTRIBUTING.md |
| Tablero Jira con backlog y acceso docente | ✅ | CHNG-02 | 1 | 33 historias en 6 sprints |
| DER (Diagrama Entidad-Relación) | ✅ | CHNG-15 | 3 | Entidades: User, Cart, CartItem, Product, Purchase |
| Plan de pruebas | ✅ | CHNG-17 | 3 | Casos unitarios e integración |
| Diagrama arquitectura + descripción | ✅ | CHNG-16 | 3 | Alto nivel con tecnologías |
| **Swagger con todos los endpoints** | ✅ | CHNG-14 | 3 | Documentación OpenAPI |
| **Backend funcionando (todos endpoints)** | ✅ | CHNG-03, CHNG-09-14 | 1-3 | Node.js + Express + APIs externas |

---

## ✅ ENTREGA 2 (Obligatoria) — ~18/06/2026

| Requisito | Status | Backlog | Sprint | Notas |
|-----------|--------|---------|--------|-------|
| Aplicación completamente funcionando | ✅ | CHNG-18-26 | 4-5 | React Native MVP |
| Documentación de pruebas + métricas | ✅ | CHNG-27 | 5 | Cobertura y casos ejecutados |
| APK firmado e instalable | ✅ | CHNG-30 | 6 | En dispositivo físico |
| Documentación final completa | ✅ | CHNG-31 | 6 | Técnica y de usuario |
| Defensa oral + demo en vivo | ✅ | CHNG-32 | 6 | 20 min demo + 5 min Q&A |

---

## ✅ REQUISITOS FUNCIONALES OBLIGATORIOS

| Requisito | Status | Backlog | Sprint | Notas |
|-----------|--------|---------|--------|-------|
| Flujo de onboarding inicial | ✅ | CHNG-08, CHNG-19 | 2, 4 | 3 pantallas de bienvenida |
| Al menos 3 flujos de pantallas (CRUD) | ✅ | CHNG-07 | 2 | Auth, Carrito, Historial |
| 3 CRUDs completos | ✅ | CHNG-10-11, CHNG-13, CHNG-14 | 2-3 | Items Carrito, Productos, Compras |
| Autenticación (email/Cloud) | ✅ | CHNG-09, CHNG-18 | 2, 4 | Supabase Auth + Google Sign-In |
| Listado con cards view | ✅ | CHNG-22, CHNG-26 | 5 | Carrito con items, Historial |

---

## ✅ REQUISITOS NO FUNCIONALES

| Requisito | Status | Backlog | Sprint | Notas |
|-----------|--------|---------|--------|-------|
| Cold start < 2.5 segundos | ✅ | Implícito en Sprint 6 | 6 | A validar en CHNG-28 |
| Manejo de errores de conectividad | ✅ | CHNG-28 | 6 | Sin internet, API caída, timeout |
| Analytics (capa gratuita) | ✅ | CHNG-29 | 6 | Backend + app |
| API Level mínimo Android | ⚠️ | **NO EXPLÍCITO** | — | **AGREGAR A SPRINT 1** |

---

## ✅ REQUISITOS ARQUITECTÓNICOS

| Requisito | Status | Backlog | Notas |
|-----------|--------|---------|-------|
| React Native | ✅ | CHNG-18-26 | Frontend |
| MVVM + Repository | ✅ | CHNG-20, CHNG-21 | Patrón de arquitectura |
| View Binding / Jetpack Compose | ✅ | Sprint 4 | A especificar en Sprint 4 |

---

## ✅ REQUISITOS UI/UX Y CX

| Requisito | Status | Backlog | Sprint | Notas |
|-----------|--------|---------|--------|-------|
| Mapa de navegación + design system | ✅ | CHNG-06 | 1 | Tipografía, colores, componentes |
| Material Design 3 | ✅ | CHNG-07 | 2 | En Figma |
| **Heurísticas de Nielsen (checklist)** | ⚠️ | **NO EXPLÍCITO** | 2 | **AGREGAR A SPRINT 2** |
| Wireframes Figma alta fidelidad | ✅ | CHNG-07 | 2 | 4 flujos navegables |
| 2-3 entrevistas/encuestas | ✅ | CHNG-05 | 1 | Personas del proyecto |
| **Personas + Journeys documentados** | ⚠️ | **NO EXPLÍCITO** | 1 | **AGREGAR A SPRINT 1** |
| Buenas prácticas de accesibilidad | ✅ | Implícito en CHNG-07 | 2 | Material Design 3 |

---

## ✅ CICLO DE DESARROLLO Y COLABORACIÓN

| Requisito | Status | Backlog | Sprint | Notas |
|-----------|--------|---------|--------|-------|
| Repositorio GitHub | ✅ | CHNG-01 | 1 | Público o privado con acceso docente |
| GitFlow + estrategia de ramas | ✅ | CHNG-01 | 1 | Feature branches, PR policy |
| Diagrama arquitectura alto nivel | ✅ | CHNG-16 | 3 | — |
| Diagrama Entidad-Relación | ✅ | CHNG-15 | 3 | — |
| **Diagrama de Secuencia** | ⚠️ | **NO EXPLÍCITO** | — | **AGREGAR A SPRINT 3** |

---

## ✅ LINEAMIENTOS PARA PRESENTACIÓN FINAL

| Requisito | Status | Backlog | Sprint | Notas |
|-----------|--------|---------|--------|-------|
| Demo en vivo (20 min) + Q&A (5 min) | ✅ | CHNG-32 | 6 | — |
| **Pitch estructurado** | ⚠️ | **PARCIAL** | 6 | Problema, usuarios, métricas, arquitectura, decisiones, aprendizajes |
| Benchmark vs app similar | ✅ | CHNG-32 | 6 | vs Precios Claros oficial |
| **Release Candidate (RC) + versionado** | ⚠️ | **NO EXPLÍCITO** | 6 | **AGREGAR** |
| Repos accesibles + builds reproducibles | ✅ | CHNG-01 | 1 | GitHub accesible |

---

## 🔴 GAPS IDENTIFICADOS — QUÉ FALTA CREAR

### **Críticos (deben estar en el backlog):**

1. **Heurísticas de Nielsen (Checklist)**
   - Sprint: 2 (junto con CHNG-07 Figma)
   - Descripción: Documenta cómo el prototipo Figma evidencia al menos 10 heurísticas de Nielsen
   - Criterio de aceptación: Checklist completado con evidencias/screenshots

2. **Personas + Customer Journeys (documentación)**
   - Sprint: 1 (junto con CHNG-05 entrevistas)
   - Descripción: A partir de las entrevistas, elaborar 2-3 personas con datos demográficos, goals, pain points
   - Criterio de aceptación: Documento con personas + journeys mapeados

3. **Definir API Level mínimo de Android**
   - Sprint: 1 (junto con CHNG-03 setup backend)
   - Descripción: Investigar y documentar qué API Level mínimo soportará la app (ej: API 24+)
   - Criterio de aceptación: Documento con justificación

4. **Diagrama de Secuencia**
   - Sprint: 3 (junto con CHNG-15-16 diagramas)
   - Descripción: Diagrama de secuencia de al menos 2 flujos críticos (ej: Auth login, Scan & Pay)
   - Criterio de aceptación: Diagramas dibujados (Figma, Draw.io o similar)

5. **Release Candidate (RC) + Versionado**
   - Sprint: 6 (junto con CHNG-30-31 documentación final)
   - Descripción: Crear RC final, documentar versionado semántico, changelog
   - Criterio de aceptación: Tag RC en repos, changelog.md actualizado

6. **Pitch + Presentación (estructura)**
   - Sprint: 6 (junto con CHNG-32 demo)
   - Descripción: Preparar estructura de pitch (problema, usuarios, métricas, arquitectura decisiones, aprendizajes)
   - Criterio de aceptación: Presentación / script listo

---

## ⚠️ ITEMS QUE NECESITAN ACLARACIÓN / AJUSTE

### **CHNG-14 (Documentación Swagger):**
- Asegurar que **TODOS** los endpoints listados en Scope_ChanguiApp.md estén documentados
- Incluir ejemplos de request/response reales
- Validar que funcione en la URL de deploy (Render)

### **CHNG-16 (Diagrama de Arquitectura):**
- Debe incluir: Frontend (React Native) ↔ Backend (Node.js) ↔ Supabase ↔ APIs externas
- Describir flujos de datos críticos (auth, carrito, pagos)

### **CHNG-27 (Pruebas Unitarias):**
- Especificar: ¿Qué métrica de cobertura (líneas, ramas, funciones)?
- Incluir al menos pruebas de controllers/services críticos (auth, cart, products)

### **CHNG-32 (Demo + Benchmark):**
- Benchmark debe ser **cuantitativo**: tiempo de respuesta, UX, features vs app Precios Claros oficial
- Preparar 2-3 escenarios de prueba reales durante la demo

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Total | Cubiertos | Faltante |
|-----------|-------|-----------|----------|
| **Requisitos Entrega 1** | 8 | 8 ✅ | 0 |
| **Requisitos Entrega 2** | 5 | 5 ✅ | 0 |
| **Requisitos Funcionales** | 5 | 5 ✅ | 0 |
| **Requisitos No Funcionales** | 4 | 3 ✅ | 1 ⚠️ |
| **Requisitos Arquitectónicos** | 3 | 3 ✅ | 0 |
| **Requisitos UI/UX** | 7 | 5 ✅ | 2 ⚠️ |
| **Ciclo de Desarrollo** | 4 | 3 ✅ | 1 ⚠️ |
| **Lineamientos Presentación** | 5 | 3 ✅ | 2 ⚠️ |
| **TOTAL** | **41** | **35 ✅** | **6 ⚠️** |

---

## 🎯 RECOMENDACIÓN

**Estás al 85% de cobertura de requisitos.**

**ANTES DE ASIGNAR TAREAS, AGREGA ESTAS 6 NUEVAS AL BACKLOG:**

1. **CHNG-34** (Sprint 1): Definir API Level mínimo Android | 1 pt
2. **CHNG-35** (Sprint 1): Documentar personas + customer journeys | 2 pts
3. **CHNG-36** (Sprint 2): Evidenciar heurísticas de Nielsen en Figma | 2 pts
4. **CHNG-37** (Sprint 3): Crear diagrama de secuencia (auth + pagos) | 2 pts
5. **CHNG-38** (Sprint 6): Preparar RC + versionado + changelog | 2 pts
6. **CHNG-39** (Sprint 6): Estructurar pitch de presentación | 1 pt

**Total puntos nuevos: 10 pts**
**Nuevo total: 117 story points**

---

*Checklist generado: 19/03/2026 | Equipo ChanguiApp*
