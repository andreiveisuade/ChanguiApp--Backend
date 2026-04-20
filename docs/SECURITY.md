# Seguridad — ChanguiApp Backend

Controles de seguridad activos en el backend. Revisar y actualizar por PR cuando algo cambie.

---

## Dependencias

### Dependabot

Activo en `.github/dependabot.yml`.

- **npm** (directory `/`): scanea semanalmente, agrupa actualizaciones de `@types/*` y de `jest*` / `ts-jest` para reducir ruido. Máximo 5 PRs abiertas a la vez, commits con prefijo `chore(deps)`.
- **github-actions**: actualiza semanalmente las versiones de los actions usados en los workflows.

Los PRs de Dependabot deben revisarse y mergearse promptly (≤ 7 días). Actualizaciones major van leídas antes de aprobar.

### npm audit

Se ejecuta en cada PR vía GitHub Actions (`.github/workflows/test.yml`).

- Nivel mínimo: `--audit-level=high`. Vulnerabilidades high/critical bloquean el merge.
- Para medium/low: se revisan pero no bloquean automáticamente.

Ejecutar local antes de pushear:

```bash
npm audit --audit-level=high
```

Si falla, evaluar:
1. Hay una versión corregida? `npm audit fix`.
2. Upgrade major requerido? Planificar con el equipo.
3. Falso positivo? Documentar excepción aquí.

### Excepciones conocidas

- **`mercadopago@^1.x`**: la versión v1 del SDK tiene dependencias con vulnerabilidades. Está en uso porque el TDD del checkout está escrito contra la API v1. Migrar a v2 post-MVP (DEV-160+).

---

## Secrets

### GitHub Secret Scanning

Activo por defecto en repositorios públicos. No se requiere configuración extra.

### Variables de entorno sensibles

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- `MP_ACCESS_TOKEN`
- `PRECIOS_CLAROS_BASE_URL`

Todas viven en `.env` (local) y en Render Environment Variables (producción). **NUNCA** se commitean.

`.gitignore` tiene `.env`, `.env.local`, `.env.production` listados. El archivo `.env.example` define las keys sin valores.

---

## Autenticación

- Supabase Auth maneja registro/login y emisión de JWTs.
- El middleware `src/middleware/auth.ts` valida cada request con `supabase.auth.getUser(token)`.
- Los endpoints protegidos requieren header `Authorization: Bearer <jwt>`.
- El único endpoint público es `POST /api/checkout/webhook` (Mercado Pago no envía token) y `GET /health`.

---

## Validación de entrada

- Los services lanzan `ApiError` con `status` apropiado ante input inválido (400, 404).
- Los controllers reciben tipos de Request parametrizados (`Request<{ code: string }>`) para que TypeScript valide los path params.
- No hay `eval()`, `new Function()` ni deserialización insegura en el codebase.

---

## Ownership / autorización

- Cada endpoint que toca datos del usuario usa `req.user!.id` (no accepta IDs desde el body/query).
- Las queries filtran por `user_id = req.user.id` donde aplique.
- Si un recurso no pertenece al usuario, se devuelve **404** (no 403) para no filtrar la existencia del recurso.

---

## Observabilidad

- Errores se loggean con `console.error` (simple). Render captura stdout/stderr.
- No hay APM/tracing en el MVP. Planeado post-MVP (DEV-164+).

---

## Responsables

- **Scrum Master (Andrei Veis):** revisión semanal de PRs de Dependabot, decisiones sobre excepciones.
- **Cada dev:** correr `npm audit` antes de abrir PR, no commitear secrets.

---

*Documento actualizado 2026-04-20 con la migración a TypeScript (DEV-160) y el setup de seguridad CI/CD (DEV-132).*
