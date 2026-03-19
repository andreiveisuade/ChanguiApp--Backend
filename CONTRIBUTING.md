# Guía de Contribución — ChanguiApp

> Política de Pull Requests, estrategia de ramas y flujo de trabajo del equipo.
> Todos los integrantes del equipo deben leer y respetar esta guía.

---

## Estrategia de Ramas (GitFlow)

```
main          ← producción / entregables finales (nunca se toca directamente)
  └── develop ← integración continua (base de todos los features)
        ├── feature/nombre-feature   ← trabajo de cada dev
        ├── fix/nombre-fix           ← correcciones de bugs
        └── chore/nombre-tarea       ← configuración, docs, infraestructura
```

### Convención de nombres de ramas

| Prefijo | Cuándo usarlo | Ejemplo |
|---------|--------------|---------|
| `feature/` | Nueva funcionalidad | `feature/escaneo-barcode` |
| `fix/` | Corrección de bug | `fix/precio-nulo-api` |
| `chore/` | Configuración, docs, deps | `chore/setup-firebase` |
| `release/` | Preparar entrega | `release/entrega-1` |

---

## Flujo de trabajo paso a paso

### 1. Antes de empezar a trabajar

```bash
# Siempre partís desde develop actualizado
git checkout develop
git pull origin develop

# Creás tu rama
git checkout -b feature/nombre-de-tu-feature
```

### 2. Mientras trabajás

- Hacé commits frecuentes y descriptivos
- Formato de commit: `tipo: descripción breve`
  - Ejemplos: `feat: agregar escáner de barcode`, `fix: manejar producto no encontrado`, `docs: actualizar README`
- Un commit por cambio lógico, no "arreglé todo" al final

### 3. Cuando terminás

```bash
# Traés los últimos cambios de develop antes de subir
git checkout develop
git pull origin develop
git checkout feature/tu-feature
git rebase develop   # resolvés conflictos acá, no en el PR

# Subís tu rama
git push origin feature/tu-feature
```

### 4. Abrís el Pull Request en GitHub

---

## Política de Pull Requests

### Reglas obligatorias (no negociables)

1. **Todo cambio entra por PR** — nadie hace push directo a `develop` ni a `main`, sin excepciones.
2. **El autor no puede hacer merge de su propio PR** — siempre lo aprueba otro integrante.
3. **Mínimo 1 aprobación** para hacer merge a `develop`.
4. **Mínimo 2 aprobaciones** para hacer merge a `main` (Scrum Master + 1 integrante).
5. **El Scrum Master es quien ejecuta el merge a `main`** en los releases de cada entrega.
6. **No hacer merge si hay comentarios sin resolver** — se resuelven o se marcan como "won't fix" con justificación.

### Qué tiene que tener un PR para ser válido

**Título:** `[TIPO] Descripción breve` → ejemplo: `[FEATURE] Escaneo de barcode con cámara`

**Descripción (template):**
```
## ¿Qué hace este PR?
Descripción breve de los cambios.

## Issue relacionado
Closes #<número de issue en Jira/GitHub>

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

- ✅ ¿El código hace lo que dice el título y la descripción del PR?
- ✅ ¿Hay algo que pueda romper funcionalidad existente?
- ✅ ¿El código es legible? (no perfecto, pero entendible por otro integrante)
- ✅ ¿Se siguen los patrones de arquitectura del proyecto (MVVM + Repository)?
- ✅ ¿Los nombres de variables/funciones tienen sentido?
- ✅ ¿Hay manejo de errores donde puede fallar (ej: llamadas a la API)?

No es un code review de producción profesional. El objetivo es que el equipo aprenda y que el código que entra a develop funcione.

---

## Protección de ramas (configurar en GitHub)

En **Settings → Branches** del repositorio:

**Rama `main`:**
- ✅ Require a pull request before merging
- ✅ Required approvals: 2
- ✅ Dismiss stale reviews
- ✅ Require status checks to pass
- ✅ Include administrators

**Rama `develop`:**
- ✅ Require a pull request before merging
- ✅ Required approvals: 1
- ✅ Dismiss stale reviews

---

## Sprints y releases

| Evento | Acción en Git |
|--------|--------------|
| Fin de sprint | Merge de `develop` a `main` con tag: `sprint-N` |
| Entrega 1 | Rama `release/entrega-1`, merge a `main`, tag `v1.0-entrega1` |
| Entrega 2 | Rama `release/entrega-2`, merge a `main`, tag `v1.0-final` |

---

## Conexión con Jira

- Cada rama debe corresponder a un issue de Jira
- Nomenclatura sugerida: `feature/CHNG-42-escaneo-barcode` (donde `CHNG-42` es el ID del issue)
- Mencioná el ID del issue en el título o descripción del PR para que Jira lo linkee automáticamente

---

*Documento mantenido por el Scrum Master. Última actualización: Marzo 2026.*
