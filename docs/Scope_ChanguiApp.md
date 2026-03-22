# DOCUMENTO DE ALCANCE DEL PROYECTO

---

## 1. Informacion General del Proyecto

| Campo | Detalle |
|-------|---------|
| **Nombre del proyecto** | ChanguiApp |
| **Materia** | Desarrollo de Aplicaciones I — UADE FAIN |
| **Equipo del proyecto** | Ezequiel Lupis · Ignacio Melinc · Ignacio Rodriguez · Andrei Veis · Maximo Vendramini |
| **Fecha estimada de finalizacion** | 18 de Junio de 2026 (Entrega 2 / Segundo Parcial) |
| **Repositorio Frontend** | [github.com/andreiveisuade/ChanguiApp--Frontend](https://github.com/andreiveisuade/ChanguiApp--Frontend) |
| **Repositorio Backend** | [github.com/andreiveisuade/ChanguiApp--Backend](https://github.com/andreiveisuade/ChanguiApp--Backend) |
| **Tablero Jira** | [andreiveis360.atlassian.net/jira/software/projects/DEV/boards/1](https://andreiveis360.atlassian.net/jira/software/projects/DEV/boards/1) |

---

## 2. Descripcion del Proyecto

ChanguiApp es una aplicacion movil orientada a consumidores argentinos que busca transformar la experiencia de compra en supermercados. La aplicacion permite al usuario seleccionar el supermercado en el que se encuentra, escanear productos mediante la camara del dispositivo, armar un carrito de compras en tiempo real con acumulacion automatica del total, y efectuar el pago directamente desde la app a traves de Mercado Pago.

Adicionalmente, la aplicacion ofrece la posibilidad de crear listas de compras previas desde el hogar. Al llegar al supermercado, el usuario puede ir escaneando los productos de su lista, que se van tachando automaticamente a medida que se agregan al carrito. De esta manera, el supermercado funciona unicamente como gondola y el proceso de caja se realiza integramente desde el dispositivo movil.

El proyecto comprende el diseno UX/UI, el desarrollo de la aplicacion movil multiplataforma (Android e iOS) en **React Native**, y la construccion de un backend propio en **Node.js + Express** con persistencia en **Supabase** (PostgreSQL + Auth), documentado mediante Swagger y desplegado en **Render**.

**Principio de diseno:** la interfaz de ChanguiApp se disena bajo la premisa de que el flujo principal (escanear, agregar al carrito, pagar) debe ser tan simple que cualquier persona pueda operarlo sin instrucciones previas. El contexto de uso es un supermercado con iluminacion intensa, donde el usuario tiene las manos ocupadas y necesita interacciones rapidas y claras. Por este motivo, la app utiliza exclusivamente un tema claro con alto contraste, tipografia legible y una estructura de navegacion minima. La complejidad funcional (listas, historial, perfil) se ubica en secciones secundarias para no interferir con el flujo core.

**Nota sobre el entorno de demostracion:** en un escenario productivo, la aplicacion se conectaria a los sistemas internos de cada cadena de supermercados para obtener precios y disponibilidad de stock. Para los fines de este trabajo practico, se utiliza la API publica de Precios Claros (SEPA, Secretaria de Comercio, Gobierno Argentino) como fuente de datos simulada. El catalogo de productos se sincroniza masivamente desde dicha API hacia Supabase, permitiendo consultas locales rapidas en cada escaneo sin depender de la disponibilidad de la API externa en tiempo real. La lista de supermercados disponibles tambien se obtiene de esta fuente.

---

## 3. Objetivos del Proyecto

### Objetivo General

Desarrollar una aplicacion movil funcional que simplifique el proceso de compra en supermercados argentinos, eliminando la friccion de las filas en caja y el desconocimiento del total acumulado, aplicando buenas practicas de arquitectura de software, diseno centrado en el usuario, pruebas e integracion continua.

### Objetivos Especificos

- Implementar un flujo completo de Scan & Go: seleccionar supermercado, escanear productos, gestionar el carrito y pagar mediante Mercado Pago.
- Permitir la creacion y gestion de listas de compras previas, con tachado automatico de items al escanearlos en el supermercado.
- Integrar Mercado Pago como pasarela de pagos en modo sandbox/test para el trabajo practico.
- Sincronizar masivamente el catalogo de productos desde la API de Precios Claros hacia Supabase, permitiendo consultas locales rapidas por codigo de barras.
- Disenar e implementar una arquitectura MVVM + Repository tanto en el frontend (React Native) como en el backend (Node.js + Express + capa de repositorios).
- Proveer autenticacion segura mediante **Supabase Auth** (Google Sign-In y email/contrasena).
- Cubrir los 3 CRUDs obligatorios del trabajo practico: **Items de Carrito**, **Usuarios / Perfil** y **Listas de Compras**.
- Persistir datos en **Supabase** (PostgreSQL) con sincronizacion masiva del catalogo de productos.
- Cumplir con un cold start inferior a 2,5 segundos (requisito no funcional de la catedra).
- Entregar un prototipo navegable de alta fidelidad en Figma, aplicando Material Design 3 y heuristicas de Nielsen evidenciadas mediante checklist.
- Documentar todos los endpoints del backend con Swagger (Entrega 1) y presentar una defensa tecnica con demo en vivo (Entrega 2).

---

## 4. Stack Tecnologico

| Capa | Tecnologia |
|------|------------|
| **Frontend (Mobile)** | React Native (Android + iOS) |
| **Patron de arquitectura** | MVVM + Repository |
| **Backend** | Node.js + Express (deploy en Render) |
| **Base de datos** | Supabase (PostgreSQL hosted) |
| **Autenticacion** | Supabase Auth (Google Sign-In + email/contrasena) |
| **Pasarela de pagos** | Mercado Pago SDK (modo sandbox/test) |
| **API de precios (demo)** | Precios Claros / SEPA (Gobierno Argentino) |
| **Documentacion API** | Swagger |
| **Control de versiones** | Git + GitHub (GitFlow) |
| **Testing backend** | Jest + Supertest |
| **Testing frontend** | React Testing Library + Jest |
| **Gestion del proyecto** | Jira (Scrum) |

---

## 5. Endpoints del Backend

### Autenticacion y Usuarios

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario (crear cuenta via Supabase Auth) |
| POST | `/api/auth/login` | Inicio de sesion |
| GET | `/api/users/profile` | Obtener perfil del usuario autenticado |
| PUT | `/api/users/profile` | Actualizar datos del perfil |
| DELETE | `/api/users/profile` | Eliminar cuenta del usuario |

### Productos

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/products/barcode/:code` | Consultar producto por codigo de barras (busqueda local en catalogo sincronizado) |

### Supermercados

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/stores` | Listar supermercados disponibles |

### Carrito

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/cart` | Ver contenido del carrito activo (items y subtotales) |
| POST | `/api/cart/items` | Agregar producto al carrito (si proviene de una lista, se marca automaticamente como comprado) |
| PUT | `/api/cart/items/:id` | Actualizar cantidad de un producto en el carrito |
| DELETE | `/api/cart/items/:id` | Quitar un producto del carrito |
| DELETE | `/api/cart` | Vaciar o cancelar el carrito completo |

### Listas de Compras

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/lists` | Crear una nueva lista de compras |
| GET | `/api/lists` | Obtener todas las listas del usuario |
| GET | `/api/lists/:id` | Ver detalle de una lista con sus items |
| PUT | `/api/lists/:id` | Actualizar nombre o datos de la lista |
| DELETE | `/api/lists/:id` | Eliminar una lista de compras |
| POST | `/api/lists/:id/items` | Agregar un item a la lista |
| PUT | `/api/lists/:listId/items/:itemId` | Actualizar un item de la lista (nombre, cantidad, estado) |
| DELETE | `/api/lists/:listId/items/:itemId` | Quitar un item de la lista |

### Pagos

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/checkout` | Iniciar pago: genera preferencia de Mercado Pago y devuelve datos para checkout in-app |
| POST | `/api/checkout/webhook` | Webhook de Mercado Pago para confirmar estado del pago |

### Historial de Compras

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/purchases` | Listar historial de compras del usuario |
| GET | `/api/purchases/:id` | Ver detalle de una compra especifica |

### Sistema

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/health` | Healthcheck del servidor |

---

## 6. CRUDs del Proyecto

La consigna requiere al menos tres CRUDs completos referentes al dominio principal de la aplicacion. Un CRUD completo implica que las cuatro operaciones (Create, Read, Update, Delete) esten disponibles para el usuario a traves de la interfaz.

### CRUD 1: Items de Carrito

| Operacion | Endpoint | Descripcion |
|-----------|----------|-------------|
| **Create** | `POST /api/cart/items` | El usuario agrega un producto escaneado al carrito |
| **Read** | `GET /api/cart` | El usuario visualiza el carrito activo con la lista de items y subtotales |
| **Update** | `PUT /api/cart/items/:id` | El usuario modifica la cantidad de un item en el carrito |
| **Delete** | `DELETE /api/cart/items/:id` | El usuario elimina un item del carrito |

### CRUD 2: Usuarios / Perfil

| Operacion | Endpoint | Descripcion |
|-----------|----------|-------------|
| **Create** | `POST /api/auth/register` | El usuario crea su cuenta mediante registro |
| **Read** | `GET /api/users/profile` | El usuario consulta los datos de su perfil |
| **Update** | `PUT /api/users/profile` | El usuario modifica sus datos personales (nombre, email, foto) |
| **Delete** | `DELETE /api/users/profile` | El usuario elimina su cuenta de forma permanente |

### CRUD 3: Listas de Compras

| Operacion | Endpoint | Descripcion |
|-----------|----------|-------------|
| **Create** | `POST /api/lists` | El usuario crea una lista de compras desde su hogar con los productos que necesita |
| **Read** | `GET /api/lists` y `GET /api/lists/:id` | El usuario consulta sus listas y el detalle de items de cada una |
| **Update** | `PUT /api/lists/:id` y `PUT /api/lists/:listId/items/:itemId` | El usuario modifica el nombre de la lista o actualiza items. Al escanear un producto en el supermercado, el item correspondiente se marca automaticamente como comprado |
| **Delete** | `DELETE /api/lists/:id` y `DELETE /api/lists/:listId/items/:itemId` | El usuario elimina una lista completa o quita items individuales |

---

## 7. Alcance del Proyecto (In Scope)

### Funcionalidades incluidas en el MVP

- Registro e inicio de sesion de usuarios (email/contrasena y Google Sign-In via Supabase Auth)
- Gestion del perfil de usuario (consulta, edicion y eliminacion de cuenta)
- Flujo de onboarding inicial en la primera apertura de la aplicacion
- Seleccion del supermercado donde se encuentra el usuario
- Escaneo de codigo de barras con la camara del dispositivo (sensor requerido por la consigna)
- Sincronizacion masiva del catalogo de precios desde la API de Precios Claros hacia Supabase, con consultas locales en cada escaneo
- Carrito de compras persistente: se mantiene activo aunque el usuario cierre la aplicacion, y solo se cierra al pagar o cancelar manualmente
- Total acumulado en tiempo real a medida que se agregan productos
- Creacion y gestion de listas de compras previas, con tachado automatico de items al escanearlos en el supermercado
- Pago in-app mediante Mercado Pago (modo sandbox/test, checkout integrado dentro de la aplicacion)
- Historial de compras anteriores con detalle por sesion, presentado como listado con cards view (requisito funcional obligatorio de la consigna)
- Backend propio en Node.js + Express con documentacion Swagger, desplegado en Render
- Persistencia y autenticacion en Supabase (PostgreSQL + Auth)
- Observabilidad mediante analytics en capa gratuita (backend y aplicacion movil)
- Buenas practicas de accesibilidad segun lo indicado por la consigna
- Tamanos de fuente escalables, permitiendo al usuario configurar el tamano segun su preferencia
- Internacionalizacion (i18n) con soporte para espanol e ingles, con posibilidad de extension a otros idiomas. Los textos de la interfaz se gestionan mediante archivos de traduccion centralizados, permitiendo cambiar el idioma desde la configuracion de la app
- Soporte multiplataforma: la aplicacion se compila y distribuye tanto para Android (APK) como para iOS (IPA)
- Persistencia local en el dispositivo mediante AsyncStorage o MMKV, incluyendo: listas de compras (creacion y edicion offline con sincronizacion al recuperar conectividad), token de sesion de Supabase Auth, y preferencias del usuario (idioma seleccionado y tamano de fuente)
- Modo offline parcial: el usuario puede crear y editar listas de compras sin conexion a internet. Las listas se almacenan localmente y se sincronizan con el backend al recuperar conectividad. El flujo de compra (escaneo, carrito, pago) requiere conexion activa

### Entregables tecnicos obligatorios

- **Entrega 1:** Prototipo Figma navegable, design system basico, flujo de pantallas, repositorio inicializado con GitFlow, tablero Jira con acceso docente, DER, diagrama de secuencia, diagrama de arquitectura, plan de pruebas, Swagger con todos los endpoints funcionando
- **Entrega 2:** APK funcional, documentacion de pruebas y metricas, documentacion tecnica y de usuario, defensa oral con demo en vivo (20 min + 5 min Q&A), benchmark frente a aplicacion similar

---

## 8. Fuera de Alcance (Out of Scope)

- Version web de la aplicacion
- Conexion con servidores reales de cadenas de supermercados (se simula con Precios Claros)
- Comparador de precios entre sucursales o supermercados
- Consulta de stock y ubicacion fisica dentro del supermercado (pasillo, gondola, sector)
- Carga manual de productos no encontrados en el catalogo sincronizado
- Gestion de metodos de pago propia (se delega integramente a Mercado Pago)
- Comprobante QR de salida (el pago confirmado funciona como comprobante)
- Carrito colaborativo o sincronizacion entre multiples dispositivos
- Modo offline completo (el flujo de compra — escaneo, carrito, pago — requiere conexion activa. Solo las listas de compras funcionan offline)
- Presupuesto inteligente con alertas de limite de gasto
- Integracion con Open Food Facts u otras APIs de datos nutricionales
- Publicacion en Google Play Store
- Soporte para versiones de Android anteriores al API Level minimo definido por el equipo
- Tema oscuro (dark mode). La aplicacion esta disenada para ser utilizada dentro de supermercados, es decir, ambientes con iluminacion artificial intensa. Un tema claro ofrece mejor legibilidad y contraste en estas condiciones. Ademas, la interfaz prioriza la simplicidad y claridad visual para que cualquier usuario, independientemente de su experiencia tecnologica, pueda operar la app sin friccion. Incorporar un selector de tema agregaria complejidad a la interfaz sin beneficio real para el contexto de uso
- Internacionalizacion mas alla de espanol e ingles (otros idiomas quedan fuera del alcance inicial)

---

## 9. Entregables del Proyecto

| Entregable | Descripcion |
|------------|-------------|
| Documento de Alcance | Scope Statement v4.0 |
| Design system basico | Tipografia, paleta de colores, componentes reutilizables (manual de marca) |
| Investigacion de usuarios | 2-3 entrevistas/encuestas, personas y customer journeys documentados |
| Prototipo Figma | Wireframes de alta fidelidad, mapa de navegacion, prototipo navegable |
| Checklist de heuristicas de Nielsen | Documento evidenciando el cumplimiento de las 10 heuristicas |
| Repositorio GitHub | Repos Frontend + Backend inicializados con GitFlow y CONTRIBUTING.md |
| Tablero Jira | Proyecto Scrum con backlog, sprints y acceso docente habilitado |
| DER | Diagrama Entidad-Relacion (Usuario, Carrito, ItemCarrito, Producto, Compra, Lista, ItemLista) |
| Diagrama de arquitectura | Diagrama de alto nivel con descripcion de tecnologias y capas |
| Diagrama de secuencia | Diagramas de secuencia para los flujos principales de la aplicacion |
| Plan de pruebas | Documento con casos de prueba unitarias y de integracion |
| Backend + Swagger (Entrega 1) | Todos los endpoints REST funcionando y documentados, deploy en Render + Supabase |
| APK/IPA + App completa (Entrega 2) | Aplicacion React Native funcional para Android e iOS con todas las funcionalidades del MVP |
| Manual de usuario | Documentacion orientada al usuario final con capturas de pantalla e instrucciones de uso |
| Metricas de calidad | Cobertura de tests, cold start medido, tiempos de respuesta de API, tamano de builds |
| Documentacion final | Documentacion tecnica, metricas, pruebas ejecutadas, Release Candidate |
| Defensa oral | Demo en vivo (20 min) + Q&A (5 min), benchmark frente a aplicacion similar |


---


## 11. Supuestos

- La API de Precios Claros (SEPA) permanece operativa para la sincronizacion inicial del catalogo.
- Mercado Pago SDK en modo sandbox permite ejecutar el flujo completo de pago sin cobros reales, utilizando tarjetas de prueba provistas por la plataforma.
- Los cinco integrantes del equipo cuentan con disponibilidad para sprints quincenales.
- El equipo dispone de dispositivos Android y/o iOS (fisicos o emuladores/simuladores) para la ejecucion de pruebas.
- Supabase en capa gratuita (Auth + PostgreSQL) ofrece disponibilidad suficiente para las demos y entregas.
- Render en capa gratuita es suficiente para alojar el backend durante el periodo del proyecto.

---

## 12. Restricciones

- Tecnologia frontend: React Native (segun decision del equipo).
- El proyecto debe cumplir con el cronograma establecido: Entrega 1 ~30/04/2026 y Entrega 2 ~18/06/2026.
- Presupuesto cero: todos los servicios deben operar en capa gratuita (Supabase, Render, Mercado Pago sandbox).
- El backend debe estar documentado con Swagger para la Entrega 1.
- La aplicacion debe implementar el patron MVVM + Repository.
- La API de Precios Claros puede modificar su estructura sin previo aviso; se mitiga mediante la sincronizacion masiva hacia Supabase.
- El cold start de la aplicacion debe ser inferior a 2,5 segundos (requisito no funcional de la catedra).
- Mercado Pago se utiliza exclusivamente en modo sandbox/test; no se procesan cobros reales.
- El carrito es persistente: se mantiene activo entre sesiones de la aplicacion y solo se cierra al pagar o cancelar manualmente.
- Se debe definir y justificar el API Level minimo de Android y la version minima de iOS soportada, de acuerdo con el publico objetivo de la aplicacion (requisito de la catedra).
- La consigna menciona vistas en XML, View Binding o Jetpack Compose como opciones arquitectonicas. Estas tecnologias corresponden al desarrollo Android nativo (Java/Kotlin). Al utilizar React Native, las vistas se implementan con componentes JSX, que cumplen el mismo rol arquitectonico dentro del patron MVVM.
- Cobertura minima del 85% en pruebas unitarias para los flujos criticos del backend (services y controllers). Las pruebas se ejecutan con Jest y los reportes de cobertura se incluyen en la documentacion final.

---

## 13. Stakeholders

| Rol | Nombre | Responsabilidad |
|-----|--------|-----------------|
| Docente / Evaluadora | Monasterio, Maria Julia | Evaluacion del proyecto, acceso al tablero Jira, revision de entregas y defensa oral |
| Scrum Master | Andrei Veis | Gestion del equipo, mantenimiento del tablero Jira, coordinacion de sprints y entregas |
| Product Owner | Ignacio Melinc | Priorizacion del backlog, definicion de historias de usuario y criterios de aceptacion |
| Tech Lead / Backend Lead | (rotativo) | Arquitectura tecnica, backend Node.js + Express, integracion con APIs externas |
| UX/UI Lead | (rotativo) | Diseno en Figma, aplicacion de Material Design 3, heuristicas de Nielsen, investigacion con usuarios |
| QA/Docs | (rotativo) | Pruebas, documentacion tecnica y de usuario, metricas de calidad |
| Usuario final (representado) | Consumidores argentinos | Personas que realizan compras en supermercados y desean controlar su gasto en tiempo real |

---

## 14. Criterios de Aceptacion

### Entrega 1 (Sprint 1-3, ~30/04/2026)

- El prototipo Figma es navegable y cubre los flujos principales: autenticacion, escaner, carrito, listas de compras, pago e historial.
- El design system basico esta definido (tipografia, colores, componentes).
- Se presentan al menos 2 personas y sus customer journeys documentados.
- El checklist de heuristicas de Nielsen esta completo y evidenciado.
- El repositorio GitHub esta inicializado con GitFlow y CONTRIBUTING.md.
- El tablero Jira tiene el backlog completo con sprints configurados y acceso docente.
- El DER representa correctamente las entidades: Usuario, Carrito, ItemCarrito, Producto, Compra, Lista, ItemLista.
- Se presentan diagramas de secuencia para los flujos principales.
- Todos los endpoints del backend responden correctamente y estan documentados en Swagger.
- La sincronizacion del catalogo desde Precios Claros hacia Supabase funciona correctamente.
- La integracion con Mercado Pago en sandbox procesa un pago de prueba de forma exitosa.
- El backend esta desplegado en Render y conectado a Supabase.

### Entrega 2 (Sprint 4-6, ~18/06/2026)

- La aplicacion React Native esta completamente funcional, cubriendo los 3 CRUDs: Items de Carrito, Usuarios/Perfil y Listas de Compras.
- La autenticacion con Supabase Auth funciona correctamente (Google Sign-In y email/contrasena).
- El escaneo de codigo de barras recupera el precio del producto desde el catalogo local en menos de 3 segundos.
- El usuario puede crear listas de compras y los items se tachan automaticamente al escanearlos.
- El boton "Pagar" abre el checkout de Mercado Pago in-app y procesa el pago en sandbox.
- El carrito se mantiene activo si el usuario cierra la aplicacion, y se cierra unicamente al pagar o cancelar.
- El cold start es inferior a 2,5 segundos.
- La aplicacion maneja correctamente errores de conectividad con mensajes adecuados al usuario.
- Se entrega APK firmado e instalable en dispositivo Android fisico, e IPA para iOS.
- El historial de compras se presenta como listado con cards view (requisito funcional obligatorio).
- La aplicacion cumple buenas practicas de accesibilidad segun lo indicado por la consigna.
- La aplicacion funciona correctamente tanto en Android como en iOS.
- Las listas de compras se pueden crear y editar sin conexion a internet, y se sincronizan con el backend al recuperar conectividad.
- El token de sesion, preferencias de idioma y tamano de fuente se persisten localmente en el dispositivo.
- La defensa oral incluye demo en vivo y benchmark frente a al menos una aplicacion similar del mercado.


