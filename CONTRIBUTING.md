# Guía de Contribución — ChanguiApp

> Política de Pull Requests, estrategia de ramas y flujo de trabajo del equipo.
> Todos los integrantes del equipo deben leer y respetar esta guía.

---

## Lenguaje del backend: TypeScript

El backend está **migrando a TypeScript** (ver issue `DEV-160`). A partir de esa migración:

- Todo archivo nuevo en `src/` y `__tests__/` se crea en `.ts`.
- No se agrega código nuevo en `.js` — si tu rama toca un archivo `.js` que todavía no se migró, aprovechá el PR para convertirlo a `.ts` también (lo coordinamos si son muchos archivos).
- El bundler/runner es `tsx` para desarrollo (hot reload) y `tsc` para compilar a `dist/` antes de producción.
- `tsconfig.json` usa `strict: true`. Nada de `any` implícito.
- Tests corren con `ts-jest` configurado en `jest.config.ts`.

Hasta que el PR de DEV-160 esté mergeado, conviven archivos `.js` y `.ts`. No es un problema mientras ninguna feature nueva entre en `.js`.

---

## Cheatsheet — Lo mínimo necesario

```bash
# 1. Abrir el issue en Jira → anotar el DEV-XXX → moverlo a "In Progress"

# 2. Crear branch desde dev
git checkout dev && git pull origin dev
git checkout -b feature/DEV-XXX-descripcion-corta    # funcionalidad nueva
git checkout -b fix/DEV-XXX-descripcion-corta        # bug fix
git checkout -b chore/DEV-XXX-descripcion-corta      # config, docs, deps
git checkout -b test/DEV-XXX-descripcion-corta       # tests (TDD)

# 3. Escribir el test PRIMERO (TDD)
# → Ver docs/TESTING.md para patrones y ejemplos
npm run test:watch                # dejar corriendo en otra terminal
# Escribir el test → falla (rojo) → implementar el código → pasa (verde)

# 4. Commitear
git add archivo1 archivo2
git commit -m "feat(cart): agregar endpoint POST /api/cart/items"
#              ^^^^  ^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
#              tipo  scope  descripción en imperativo, minúscula
# Tipos: feat | fix | docs | test | refactor | chore | style
# Archivos nuevos: .ts (TypeScript). No agregar código en .js.

# 5. Antes de subir, rebasear contra dev
git checkout dev && git pull origin dev
git checkout feature/DEV-XXX-descripcion-corta
git rebase dev    # resolver conflictos acá, no en el PR

# 6. Subir y abrir PR
git push origin feature/DEV-XXX-descripcion-corta
# → GitHub → New Pull Request → base: dev
# → Título: [FEATURE] DEV-XXX: Descripción breve
# → Descripción: "Closes DEV-XXX" + qué hace + cómo probarlo

# 7. Esperar review (se necesita aprobación, el autor no puede mergear su propio PR)

# 8. Cuando se mergea → mover el issue a "Done" en Jira
```

**Regla de oro:** nunca se pushea directo a `dev`, `test` ni `main`. Todo entra por PR.

El resto del documento tiene los detalles. Ante dudas, consultar la sección correspondiente.

---

## Estrategia de Ramas

```
main (release)    ← entregables finales, versiones estables (nunca se toca directamente)
  └── test        ← rama de QA, se testea acá antes de subir a main
        └── dev   ← integración continua, base de todos los features
              ├── feature/nombre-feature   ← trabajo de cada dev
              ├── fix/nombre-fix           ← correcciones de bugs
              └── chore/nombre-tarea       ← configuración, docs, infraestructura
```

### Flujo de promoción de código

```
feature/xxx  ──PR──►  dev  ──PR──►  test  ──PR──►  main (release)
                       │              │               │
                   integración     pruebas QA      producción
                   continua        y validación    / entrega
```

1. **dev** — Acá se integra todo. Las feature branches se mergean acá.
2. **test** — Cuando dev está estable, se hace PR a test para pruebas de QA. Se valida que todo funcione junto antes de la entrega.
3. **main (release)** — Solo recibe merges desde test. Representa la versión entregable. Cada merge a main se tagea.

### Convención de nombres de ramas

| Prefijo | Cuándo usarlo | Ejemplo |
|---------|--------------|---------|
| `feature/` | Nueva funcionalidad | `feature/DEV-21-escaneo-barcode` |
| `fix/` | Corrección de bug | `fix/DEV-35-precio-nulo-api` |
| `chore/` | Configuración, docs, deps | `chore/DEV-03-setup-supabase` |
| `test/` | Agregar o mejorar tests | `test/DEV-136-tests-auth` |
| `hotfix/` | Fix crítico directo en test | `hotfix/crash-checkout` |

---

## Flujo de trabajo paso a paso

### 1. Antes de empezar a trabajar

```bash
# Siempre partir desde dev actualizado
git checkout dev
git pull origin dev

# Crear la rama
git checkout -b feature/DEV-XX-nombre-del-feature
```

### 2. Durante el desarrollo

- **Si es un endpoint o service nuevo: escribir el test primero** (ver `docs/TESTING.md`)
- Correr `npm run test:watch` en otra terminal para feedback inmediato
- El test falla → se implementa → el test pasa. Ese es el ciclo.
- Hacer commits frecuentes y descriptivos
- Formato de commit: `tipo(scope): descripción breve`
- Un commit por cambio lógico, no "arreglé todo" al final
- Si el commit cierra un issue, agregar `DEV-XX` en el mensaje

**Ejemplo completo:**
```
feat(cart): agregar endpoint POST /api/cart/items

Implementa la lógica para agregar productos al carrito activo.
Si el producto está en una lista de compras, se marca como comprado.

DEV-20
```

### 3. Al terminar

```bash
# Traer los últimos cambios de dev antes de subir
git checkout dev
git pull origin dev
git checkout feature/DEV-XX-el-feature
git rebase dev   # resolver conflictos acá, no en el PR

# Subir la rama
git push origin feature/DEV-XX-el-feature
```

### 4. Abrir el Pull Request en GitHub → hacia `dev`

Después de pushear la branch, ir a GitHub y crear el PR:

1. **Entrar al repositorio en GitHub** (ej: github.com/andreiveisuade/ChanguiApp--Backend)
2. GitHub muestra un banner amarillo que dice *"feature/DEV-XX-... had recent pushes — Compare & pull request"*. Hacer click en ese botón.
   - Si no aparece el banner: ir a la pestaña **Pull requests** → **New pull request**
3. **Verificar las ramas:**
   - `base: dev` ← acá van los cambios (rama destino)
   - `compare: feature/DEV-XX-el-feature` ← la rama origen
   - Si dice `base: main`, cambiarlo a `dev`. Nunca apuntar a main directamente.
4. **Completar el título:** `[FEATURE] DEV-XX: Descripción breve`
5. **Completar la descripción** usando el template (ver abajo)
6. **En la barra lateral derecha:**
   - **Reviewers:** asignar a un compañero para que revise el código
   - **Assignees:** asignarse uno mismo
   - **Labels:** opcional (feature, fix, chore, etc.)
7. Hacer click en **Create pull request**
8. Esperar a que el reviewer lo apruebe. Si se piden cambios, hacerlos en la misma branch, commitear y pushear — el PR se actualiza solo.

### 5. Al recibir un review asignado

Cuando se asigna un PR para review, el proceso es:

1. **Entrar al PR** desde la pestaña "Pull requests" o desde la notificación de GitHub
2. **Leer la descripción** para entender qué hace el PR
3. **Ir a la pestaña "Files changed"** — ahí se ve todo el código modificado
4. **Revisar el código:**
   - ¿Hace lo que dice la descripción?
   - ¿Hay algo que pueda romper lo que ya funciona?
   - ¿Es legible? ¿Se entiende?
   - ¿Sigue la arquitectura del proyecto (controllers → services → repositories)?
5. **Para dejar un comentario:** hacer click en el `+` que aparece al lado de una línea de código y escribir el comentario
6. **Al terminar la revisión,** hacer click en **"Review changes"** (botón verde arriba a la derecha):
   - **Approve:** todo bien, se puede mergear
   - **Request changes:** hay cosas que corregir antes de mergear
   - **Comment:** se dejan comentarios sin aprobar ni rechazar
7. **Si se aprobó:** ahora se puede hacer click en **"Merge pull request"** → **"Confirm merge"** (el autor no puede mergear su propio PR)
8. **Después del merge:** GitHub pregunta si se quiere borrar la branch. Confirmar — ya no se necesita.

---

## Política de Pull Requests

### Reglas obligatorias (no negociables)

1. **Todo cambio entra por PR** — nadie hace push directo a `dev`, `test` ni `main`, sin excepciones.
2. **El autor no puede hacer merge de su propio PR** — siempre lo aprueba otro integrante.
3. **No hacer merge si hay comentarios sin resolver** — se resuelven o se marcan como "won't fix" con justificación.

### Aprobaciones requeridas por rama

| Rama destino | Aprobaciones | Quién puede mergear |
|-------------|-------------|---------------------|
| `dev` | Mínimo **1 aprobación** (SM) | SM (Andrei) |
| `test` | Mínimo **1 aprobación** (SM) | SM (Andrei) |
| `main` | Mínimo **1 aprobación** (SM) | SM (Andrei) |

### Qué tiene que tener un PR para ser válido

**Título:** `[TIPO] DEV-XXX: Descripción breve` → ejemplo: `[FEATURE] DEV-30: Escaneo de barcode con cámara`

**Descripción (template):**
```
## ¿Qué hace este PR?
Descripción breve de los cambios.

## Issue relacionado
Closes DEV-<número>

## Cómo probarlo
1. Paso 1
2. Paso 2
3. Resultado esperado

## Checklist
- [ ] El código compila sin errores (`npm run build` — TypeScript)
- [ ] Probado en emulador / dispositivo físico
- [ ] No hay console.log / prints de debug innecesarios
- [ ] Documentación actualizada si corresponde
- [ ] Tests pasan (`npm test`)
- [ ] Tests incluidos para el código nuevo (ver `docs/TESTING.md`)
- [ ] Coverage del código nuevo al 100% (`npm run test:coverage`)
- [ ] Archivos nuevos están en TypeScript (`.ts`, no `.js`)
```

### Tiempos de revisión

| Acción | Tiempo máximo |
|--------|--------------|
| Revisar un PR asignado | 48 horas hábiles |
| Responder a cambios pedidos | 24 horas hábiles |
| Si no hay respuesta en ese tiempo | El SM puede reasignar el review |

---

## Responsabilidades del reviewer

Al revisar un PR, verificar:

- ¿El código hace lo que dice el título y la descripción del PR?
- ¿Hay algo que pueda romper funcionalidad existente?
- ¿El código es legible? (no perfecto, pero entendible por otro integrante)
- ¿Se siguen los patrones de arquitectura del proyecto (MVVM + Repository)?
- ¿Los nombres de variables/funciones tienen sentido?
- ¿Hay manejo de errores donde puede fallar (ej: llamadas a la API)?
- ¿Hay tests que cubran el código nuevo? (unit para services, integration para endpoints)
- ¿Los tests son válidos? (no solo `expect(true).toBe(true)`)
- ¿Se usan los helpers compartidos? (`mockSupabase`, `testData`)

No es un code review de producción profesional. El objetivo es que el equipo aprenda y que el código que entra a dev funcione.

---

## Protección de ramas (configurar en GitHub)

En **Settings → Branches** del repositorio:

**Rama `main`:**
- Require a pull request before merging
- Required approvals: 1
- Dismiss stale reviews
- Require status checks to pass
- Include administrators

**Rama `test`:**
- Require a pull request before merging
- Required approvals: 1
- Dismiss stale reviews

**Rama `dev`:**
- Require a pull request before merging
- Required approvals: 1
- Dismiss stale reviews

---

## Sprints y releases

| Evento | Acción en Git |
|--------|--------------|
| Fin de sprint | PR de `dev` → `test`, validar, luego PR de `test` → `main` con tag `sprint-N` |
| Entrega 1 | PR `dev` → `test` → `main`, tag `v1.0-entrega1` |
| Entrega 2 | PR `dev` → `test` → `main`, tag `v2.0-final` |
| Hotfix en test | Crear `hotfix/xxx` desde `test`, mergear a `test` y bajar a `dev` |

---

## Convenciones de nomenclatura

### Prefijos de ramas

| Prefijo | Cuándo | Ejemplo |
|---------|--------|---------|
| `feature/` | Nueva funcionalidad o endpoint | `feature/DEV-20-crud-cart-items` |
| `fix/` | Corrección de un bug | `fix/DEV-35-precio-nulo-api` |
| `chore/` | Config, docs, deps, infra | `chore/DEV-109-setup-jest` |
| `test/` | Agregar o mejorar tests | `test/DEV-34-cobertura-services` |
| `hotfix/` | Fix crítico directo en test/main | `hotfix/crash-checkout` |

**Formato obligatorio:** `prefijo/DEV-XXX-descripcion-corta`

- `DEV-XXX` es el ID del issue en Jira (visible en el board o en la URL del issue)
- La descripción va en minúsculas, separada por guiones, sin acentos
- Los issues en Jira tienen un código `CHNG-XX` en el título — es un código interno del backlog. Para Git siempre se usa `DEV-XXX` que es la key de Jira

### Tipos de commit (Conventional Commits)

| Tipo | Cuándo usarlo | Ejemplo |
|------|--------------|---------|
| `feat` | Nueva funcionalidad | `feat(auth): implementar registro con Supabase Auth` |
| `fix` | Corrección de bug | `fix(cart): manejar carrito vacío al intentar pagar` |
| `docs` | Documentación | `docs(swagger): agregar endpoint GET /api/stores` |
| `test` | Agregar o modificar tests | `test(cart): agregar tests del service de carrito` |
| `refactor` | Refactoreo sin cambio funcional | `refactor(products): extraer lógica de sync a service` |
| `chore` | Config, deps, CI/CD | `chore: actualizar dependencias de express` |
| `style` | Formato, espacios, punto y coma | `style: correr linter en controllers/` |

**Formato:** `tipo(scope): descripción en imperativo`

- El `scope` es opcional pero recomendado (ej: `auth`, `cart`, `lists`, `products`, `checkout`)
- La descripción empieza en minúscula, sin punto final
- Primera línea máximo 72 caracteres
- Si se necesita más detalle, dejar una línea en blanco y escribir el cuerpo

### Títulos de PR

**Formato:** `[TIPO] DEV-XXX: Descripción breve`

| Tipo | Ejemplo |
|------|---------|
| `[FEATURE]` | `[FEATURE] DEV-20: CRUD de items de carrito` |
| `[FIX]` | `[FIX] DEV-35: Manejar errores de conectividad` |
| `[CHORE]` | `[CHORE] DEV-109: Configurar Jest + primer test` |
| `[TEST]` | `[TEST] DEV-34: Tests unitarios de cart service` |
| `[DOCS]` | `[DOCS] DEV-23: Documentar endpoints en Swagger` |

---

## Conexión con Jira — Paso a paso

### El flujo completo: de Jira a GitHub y vuelta

```
1. Abrir el issue en Jira             → Se ve DEV-XXX con la descripción de qué hacer
2. Mover el issue a "In Progress"     → El equipo sabe que se está trabajando en esto
3. Crear la branch en Git             → feature/DEV-XXX-descripcion
4. Trabajar, commitear                → feat(scope): descripción | DEV-XXX
5. Abrir PR en GitHub → dev           → [FEATURE] DEV-XXX: Descripción | "Closes DEV-XXX"
6. Alguien revisa y aprueba           → Se mergea a dev
7. Mover el issue a "Done" en Jira    → Listo
```

### Reglas de conexión

- **Cada rama = un issue de Jira.** No hay ramas sin issue (excepto hotfixes de emergencia).
- **La key de Jira va en el nombre de la rama:** `feature/DEV-20-crud-cart-items`
- **La key de Jira va en el PR:** escribir `Closes DEV-20` en la descripción del PR. GitHub lo linkea automáticamente si Jira está conectado.
- **La key de Jira va en los commits:** mencionar `DEV-XX` al final del mensaje para trazabilidad.
- **Actualizar el estado en Jira** cuando se empieza (In Progress) y cuando se mergea (Done). No dejar issues en "To Do" si ya se está trabajando en ellas.

### ¿Qué es CHNG-XX vs DEV-XX?

- **`CHNG-XX`** es un código interno que aparece en el **título** de cada issue en Jira (ej: "CHNG-12: Sync catálogo Precios Claros"). Es para identificar la historia en el backlog.
- **`DEV-XXX`** es la **key automática** que Jira asigna a cada issue (ej: DEV-21). Es la que se usa en Git para branches, commits y PRs.
- En Git siempre se usa **DEV-XXX**, nunca CHNG-XX.

---

*Documento mantenido por el Scrum Master. Última actualización: 20 Abril 2026 — anuncio de migración a TypeScript (DEV-160).*
