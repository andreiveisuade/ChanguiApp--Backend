# Setup de base de datos — Supabase

Instrucciones para inicializar el esquema de ChanguiApp en un proyecto Supabase.

## Dev vs prod

Cada dev del equipo debe tener **su propio proyecto Supabase free** para desarrollo local. **Nunca apuntar tu `.env` local al proyecto de prod** — un sync, un seed o un test puede pisar datos reales.

- **Prod**: el proyecto Supabase conectado a Render (auto-deploy desde `main`). Lo gestiona el SM.
- **Dev local (cada uno el suyo)**: proyecto Supabase free, separado por dev, con el mismo schema aplicado.

### Setup dev local (5 min, una sola vez)

1. Crear cuenta en https://supabase.com con tu mail de UADE (o el que prefieras).
2. **New project** → nombre sugerido `changuiapp-dev-<tu-nombre>`, region `South America (São Paulo)`, plan **Free**.
3. Esperar ~2 min a que provisione la DB.
4. Aplicar el schema: SQL Editor → New query → pegar todo `db/schema.sql` → Run. (Idempotente, podés re-correrlo cuando se actualice).
5. Settings → API → copiar `Project URL`, `anon key`, `service_role key` a tu `.env` local (ver `.env.example`).
6. Verificar: `npm run dev` arranca sin errores y `curl http://localhost:3000/health` devuelve `{"status":"ok"}`.

## Prerrequisitos

- Proyecto creado en https://supabase.com
- Acceso al SQL Editor del dashboard
- Variables de entorno configuradas en `.env`:
  - `SUPABASE_URL` — URL del proyecto
  - `SUPABASE_SERVICE_ROLE_KEY` — key con permisos completos (usada por el backend)
  - `SUPABASE_ANON_KEY` — key pública (usada para validar tokens de Auth)

## Pasos

### 1. Ejecutar el esquema

1. Entrar al dashboard del proyecto en Supabase.
2. Ir a **SQL Editor** → **New query**.
3. Pegar el contenido de [`db/schema.sql`](../db/schema.sql).
4. Presionar **Run**.

Esto crea las 9 tablas del DER (`users`, `stores`, `products`, `carts`, `cart_items`, `lists`, `list_items`, `purchases`, `purchase_items`) con sus FKs, índices y el trigger de `updated_at`, más la tabla operativa `sync_jobs` (estado de los jobs de sincronización con Precios Claros — DEV-164).

### 2. Cargar datos de prueba (opcional, recomendado para dev)

1. En el SQL Editor, abrir otro **New query**.
2. Pegar el contenido de [`db/seed.sql`](../db/seed.sql).
3. Presionar **Run**.

Esto inserta:
- Un `store` de prueba (Coto Barrio Norte).
- 5 `products` con barcodes reales de productos argentinos.

### 3. Verificar

En el **Table Editor** del dashboard debe verse:
- 10 tablas creadas (9 del DER + `sync_jobs`)
- Tabla `stores` con 1 fila
- Tabla `products` con 5 filas

## Idempotencia

Tanto `schema.sql` como `seed.sql` son idempotentes: pueden ejecutarse varias veces sin error gracias a `CREATE TABLE IF NOT EXISTS` y `ON CONFLICT DO NOTHING`.

## Actualización del esquema

Los cambios al esquema deben entrar por PR modificando `db/schema.sql`. Un cambio que agrega columnas o tablas es seguro. Un cambio que modifica columnas existentes requiere un bloque de migración separado (ALTER TABLE) documentado en el PR.
