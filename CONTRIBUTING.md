# Guía de Contribución — ChanguiApp

> Política de Pull Requests, estrategia de ramas y flujo de trabajo del equipo.
> Todos los integrantes del equipo deben leer y respetar esta guía.

---

## Cheatsheet — Lo mínimo que tenés que saber

```bash
# 1. Abrí tu issue en Jira → anotá el DEV-XXX → movelo a "In Progress"

# 2. Creá tu branch desde dev
git checkout dev && git pull origin dev
git checkout -b feature/DEV-XXX-descripcion-corta    # funcionalidad nueva
git checkout -b fix/DEV-XXX-descripcion-corta        # bug fix
git checkout -b chore/DEV-XXX-descripcion-corta      # config, docs, deps
git checkout -b test/DEV-XXX-descripcion-corta       # tests (TDD)

# 3. Escribí el test PRIMERO (TDD)
# → Ver docs/TESTING.md para patrones y ejemplos
npm run test:watch                # dejá corriendo en otra terminal
# Escribí el test → falla (rojo) → implementá el código → pasa (verde)

# 4. Commiteá
git add archivo1 archivo2
git commit -m "feat(cart): agregar endpoint POST /api/cart/items"
#              ^^^^  ^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
#              tipo  scope  descripción en imperativo, minúscula
# Tipos: feat | fix | docs | test | refactor | chore | style

# 5. Antes de subir, rebaseá contra dev
git checkout dev && git pull origin dev
git checkout feature/DEV-XXX-descripcion-corta
git rebase dev    # resolvé conflictos acá, no en el PR

# 6. Subí y abrí PR
git push origin feature/DEV-XXX-descripcion-corta
# → GitHub → New Pull Request → base: dev
# → Título: [FEATURE] DEV-XXX: Descripción breve
# → Descripción: "Closes DEV-XXX" + qué hace + cómo probarlo

# 7. Esperá review (alguien tiene que aprobar, vos no podés mergear tu propio PR)

# 8. Cuando se mergea → mové el issue a "Done" en Jira
```

**Regla de oro:** nunca pusheás directo a `dev`, `test` ni `main`. Todo entra por PR.

El resto del documento tiene los detalles. Si tenés dudas, leé la sección que necesitás.

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
2. **test** — Cuando dev está estable, se hace PR a test para pruebas de QA. Acá se valida que todo funcione junto antes de la entrega.
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
# Siempre partís desde dev actualizado
git checkout dev
git pull origin dev

# Creás tu rama
git checkout -b feature/DEV-XX-nombre-de-tu-feature
```

### 2. Mientras trabajás

- **Si es un endpoint o service nuevo: escribí el test primero** (ver `docs/TESTING.md`)
- Corré `npm run test:watch` en otra terminal para feedback inmediato
- El test falla → implementás → el test pasa. Ese es el ciclo.
- Hacé commits frecuentes y descriptivos
- Formato de commit: `tipo(scope): descripción breve`
- Un commit por cambio lógico, no "arreglé todo" al final
- Si el commit cierra un issue, agregá `DEV-XX` en el mensaje

**Ejemplo completo:**
```
feat(cart): agregar endpoint POST /api/cart/items

Implementa la lógica para agregar productos al carrito activo.
Si el producto está en una lista de compras, se marca como comprado.

DEV-20
```

### 3. Cuando terminás

```bash
# Traés los últimos cambios de dev antes de subir
git checkout dev
git pull origin dev
git checkout feature/DEV-XX-tu-feature
git rebase dev   # resolvés conflictos acá, no en el PR

# Subís tu rama
git push origin feature/DEV-XX-tu-feature
```

### 4. Abrís el Pull Request en GitHub → hacia `dev`

Después de pushear tu branch, entrás a GitHub y creás el PR:

1. **Entrá al repositorio en GitHub** (ej: github.com/andreiveisuade/ChanguiApp--Backend)
2. GitHub te va a mostrar un banner amarillo que dice *"feature/DEV-XX-... had recent pushes — Compare & pull request"*. Hacé click en ese botón.
   - Si no aparece el banner: andá a la pestaña **Pull requests** → **New pull request**
3. **Verificá las ramas:**
   - `base: dev` ← acá van tus cambios (rama destino)
   - `compare: feature/DEV-XX-tu-feature` ← tu rama (rama origen)
   - Si dice `base: main`, cambialo a `dev`. Nunca apuntes a main directamente.
4. **Completá el título:** `[FEATURE] DEV-XX: Descripción breve`
5. **Completá la descripción** usando el template (ver abajo)
6. **En la barra lateral derecha:**
   - **Reviewers:** asigná a un compañero para que revise tu código
   - **Assignees:** ponete a vos mismo
   - **Labels:** opcional (feature, fix, chore, etc.)
7. Hacé click en **Create pull request**
8. Esperá a que tu reviewer lo apruebe. Si te piden cambios, hacelos en tu misma branch, commiteá y pusheá — el PR se actualiza solo.

### 5. Cuando te piden review a vos

Alguien del equipo abrió un PR y te asignó como reviewer. Esto es lo que hacés:

1. **Entrá al PR** desde la pestaña "Pull requests" o desde la notificación de GitHub
2. **Leé la descripción** para entender qué hace el PR
3. **Andá a la pestaña "Files changed"** — ahí ves todo el código que se modificó
4. **Revisá el código:**
   - ¿Hace lo que dice la descripción?
   - ¿Hay algo que pueda romper lo que ya funciona?
   - ¿Es legible? ¿Se entiende?
   - ¿Sigue la arquitectura del proyecto (controllers → services → repositories)?
5. **Si querés comentar algo:** hacé click en el `+` que aparece al lado de una línea de código y escribí tu comentario
6. **Cuando terminaste de revisar,** hacé click en **"Review changes"** (botón verde arriba a la derecha):
   - **Approve:** todo bien, se puede mergear
   - **Request changes:** hay cosas que corregir antes de mergear
   - **Comment:** dejás comentarios sin aprobar ni rechazar
7. **Si aprobaste:** ahora el autor (o vos si no sos el autor) puede hacer click en **"Merge pull request"** → **"Confirm merge"**
8. **Después del merge:** GitHub te pregunta si querés borrar la branch. Dale que sí — ya no se necesita.

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
- [ ] El código compila sin errores
- [ ] Probé en emulador / dispositivo físico
- [ ] No hay console.log / prints de debug innecesarios
- [ ] Actualicé la documentación si corresponde
- [ ] Tests pasan (`npm test`)
- [ ] Incluí tests para el código nuevo (ver `docs/TESTING.md`)
- [ ] Coverage del código nuevo al 100% (`npm run test:coverage`)
```

### Tiempos de revisión

| Acción | Tiempo máximo |
|--------|--------------|
| Revisar un PR asignado | 48 horas hábiles |
| Responder a cambios pedidos | 24 horas hábiles |
| Si no hay respuesta en ese tiempo | El SM puede reasignar el review |

---

## Responsabilidades del reviewer

Cuando te asignan como reviewer, revisá:

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

- `DEV-XXX` es el ID del issue en Jira (lo ven en el board o en la URL del issue)
- La descripción va en minúsculas, separada por guiones, sin acentos
- Los issues en Jira tienen un código `CHNG-XX` en el título — eso es un código interno del backlog. Para Git siempre usamos `DEV-XXX` que es la key de Jira

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
- Si necesitás más detalle, dejá una línea en blanco y escribí el cuerpo

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
1. Abrís tu issue en Jira          → Ves DEV-XXX con la descripción de qué hacer
2. Movés el issue a "In Progress"  → El equipo sabe que estás trabajando en esto
3. Creás la branch en Git          → feature/DEV-XXX-descripcion
4. Trabajás, commiteás             → feat(scope): descripción | DEV-XXX
5. Abrís PR en GitHub → dev        → [FEATURE] DEV-XXX: Descripción | "Closes DEV-XXX"
6. Alguien revisa y aprueba        → Se mergea a dev
7. Movés el issue a "Done" en Jira → Listo
```

### Reglas de conexión

- **Cada rama = un issue de Jira.** No hay ramas sin issue (excepto hotfixes de emergencia).
- **La key de Jira va en el nombre de la rama:** `feature/DEV-20-crud-cart-items`
- **La key de Jira va en el PR:** escribí `Closes DEV-20` en la descripción del PR. GitHub lo linkea automáticamente si Jira está conectado.
- **La key de Jira va en los commits:** mencioná `DEV-XX` al final del mensaje para trazabilidad.
- **Actualizá el estado en Jira** cuando empezás (In Progress) y cuando se mergea (Done). No dejes issues en "To Do" si ya estás trabajando en ellas.

### ¿Qué es CHNG-XX vs DEV-XX?

- **`CHNG-XX`** es un código interno que aparece en el **título** de cada issue en Jira (ej: "CHNG-12: Sync catálogo Precios Claros"). Es para identificar la historia en el backlog.
- **`DEV-XXX`** es la **key automática** que Jira asigna a cada issue (ej: DEV-21). Es la que usamos en Git para branches, commits y PRs.
- En Git siempre usamos **DEV-XXX**, nunca CHNG-XX.

---

*Documento mantenido por el Scrum Master. Última actualización: 21 Marzo 2026.*
