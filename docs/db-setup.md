# Setup de base de datos — Supabase

Instrucciones para inicializar el esquema de ChanguiApp en un proyecto Supabase.

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

Esto crea las 9 tablas del DER (`users`, `stores`, `products`, `carts`, `cart_items`, `lists`, `list_items`, `purchases`, `purchase_items`) con sus FKs, índices y el trigger de `updated_at`.

### 2. Cargar datos de prueba (opcional, recomendado para dev)

1. En el SQL Editor, abrir otro **New query**.
2. Pegar el contenido de [`db/seed.sql`](../db/seed.sql).
3. Presionar **Run**.

Esto inserta:
- Un `store` de prueba (Coto Barrio Norte).
- 5 `products` con barcodes reales de productos argentinos.

### 3. Verificar

En el **Table Editor** del dashboard debe verse:
- 9 tablas creadas
- Tabla `stores` con 1 fila
- Tabla `products` con 5 filas

## Idempotencia

Tanto `schema.sql` como `seed.sql` son idempotentes: pueden ejecutarse varias veces sin error gracias a `CREATE TABLE IF NOT EXISTS` y `ON CONFLICT DO NOTHING`.

## Actualización del esquema

Los cambios al esquema deben entrar por PR modificando `db/schema.sql`. Un cambio que agrega columnas o tablas es seguro. Un cambio que modifica columnas existentes requiere un bloque de migración separado (ALTER TABLE) documentado en el PR.
