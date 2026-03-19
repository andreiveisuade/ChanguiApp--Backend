# Guía de Contribución — ChanguiApp

> Política de Pull Requests, estrategia de ramas y flujo de trabajo del equipo.
> Todos los integrantes del equipo deben leer y respetar esta guía.

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

- Hacé commits frecuentes y descriptivos
- Formato de commit: `tipo: descripción breve`
  - Ejemplos: `feat: agregar escáner de barcode`, `fix: manejar producto no encontrado`, `docs: actualizar README`
- Un commit por cambio lógico, no "arreglé todo" al final

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

---

## Política de Pull Requests

### Reglas obligatorias (no negociables)

1. **Todo cambio entra por PR** — nadie hace push directo a `dev`, `test` ni `main`, sin excepciones.
2. **El autor no puede hacer merge de su propio PR** — siempre lo aprueba otro integrante.
3. **No hacer merge si hay comentarios sin resolver** — se resuelven o se marcan como "won't fix" con justificación.

### Aprobaciones requeridas por rama

| Rama destino | Aprobaciones | Quién puede mergear |
|-------------|-------------|---------------------|
| `dev` | Mínimo **1 aprobación** | Cualquier integrante (que no sea el autor) |
| `test` | Mínimo **1 aprobación** + SM informado | SM o Tech Lead |
| `main` | Mínimo **2 aprobaciones** (SM obligatorio) | Solo el SM |

### Qué tiene que tener un PR para ser válido

**Título:** `[TIPO] Descripción breve` → ejemplo: `[FEATURE] Escaneo de barcode con cámara`

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

No es un code review de producción profesional. El objetivo es que el equipo aprenda y que el código que entra a dev funcione.

---

## Protección de ramas (configurar en GitHub)

En **Settings → Branches** del repositorio:

**Rama `main`:**
- Require a pull request before merging
- Required approvals: 2
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

## Conexión con Jira

- Cada rama debe corresponder a un issue de Jira
- Nomenclatura: `feature/DEV-21-escaneo-barcode` (donde `DEV-21` es el ID del issue en Jira)
- Mencioná el ID del issue (ej: `DEV-21`) en el título o descripción del PR para que Jira lo linkee automáticamente

---

*Documento mantenido por el Scrum Master. Última actualización: Marzo 2026.*
