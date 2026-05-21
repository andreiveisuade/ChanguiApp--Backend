# Setup de base de datos — Supabase

Instrucciones para inicializar el esquema de ChanguiApp en un proyecto Supabase.

## Supabase del equipo (compartido)

El equipo usa **un único proyecto Supabase** (`ChanguiAPP Database`) tanto para producción como para desarrollo local. El SM gestiona el proyecto y comparte las creds al equipo por canal privado.

**Implicación importante**: cuando corrés `npm run dev` localmente, estás escribiendo a la misma DB que sirve a Render. Por eso:

- **NO disparar el endpoint `POST /api/admin/sync-precios-claros` desde local** salvo que sea intencional. Es idempotente (no duplica productos por el constraint `UNIQUE(barcode)`), pero **bloquea por 25 minutos a cualquier otro sync** (el endpoint devuelve 409 mientras hay uno running) y ocupa cuota de la API de Precios Claros del equipo.
- **NO correr `seed.sql` contra la DB compartida** sin coordinar. Está pensado para un proyecto vacío inicial.
- **Para smoke local de un sync** sin escribir a `products` real: override la env var `PRECIOS_CLAROS_URL` a una URL muerta (`http://10.255.255.1` o similar). El job arranca, falla rápido, marca `failed` en `sync_jobs`, no toca `products`.

Cuando arranca un dev nuevo al equipo, el SM le pasa las 3 creds (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) para que las pegue en su `.env`.

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
