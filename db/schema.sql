-- ChanguiApp — Schema inicial
-- Ejecutar en Supabase SQL Editor (dashboard).
-- Referencia: docs/DER/DER.md

-- ============================================================
-- users — extiende el perfil de Supabase Auth
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- stores — supermercados (MVP: un solo store activo)
-- ============================================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  chain TEXT,
  address TEXT NOT NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  precios_claros_id TEXT,
  synced_at TIMESTAMPTZ
);

-- ============================================================
-- products — catálogo sincronizado desde Precios Claros
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  synced_at TIMESTAMPTZ
);

-- DEV-190: catalogo incremental para el cache local del front. Aditivo e
-- idempotente: ADD COLUMN IF NOT EXISTS cubre tanto una DB fresca como la prod
-- ya existente al re-correr este bloque en el SQL Editor de Supabase.
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- updated_at solo cambia cuando un campo relevante cambia de verdad (el sync
-- re-upsertea todo el catalogo a diario; sin esto el delta seria el catalogo entero).
CREATE OR REPLACE FUNCTION products_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name
     OR NEW.brand IS DISTINCT FROM OLD.brand
     OR NEW.price IS DISTINCT FROM OLD.price
     OR NEW.image_url IS DISTINCT FROM OLD.image_url THEN
    NEW.updated_at := NOW();
  ELSE
    NEW.updated_at := OLD.updated_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_touch_updated_at ON products;
CREATE TRIGGER trg_products_touch_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_touch_updated_at();

-- ============================================================
-- carts — un carrito activo por usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'checked_out', 'closed')),
  mp_preference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_user_status ON carts(user_id, status);

-- ============================================================
-- cart_items — productos dentro de un carrito
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

-- ============================================================
-- lists — listas de compras del usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- list_items — items de una lista (sin FK a products, el usuario puede agregar libremente)
-- ============================================================
CREATE TABLE IF NOT EXISTS list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  barcode TEXT,
  quantity INTEGER,
  purchased BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- purchases — historial de compras confirmadas por Mercado Pago
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id),
  total NUMERIC(10, 2) NOT NULL,
  payment_id TEXT NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed')),
  mp_preference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_created ON purchases(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user_preference ON purchases(user_id, mp_preference_id);

-- ============================================================
-- purchase_items — snapshot inmutable de los productos comprados
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  barcode TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL
);

-- ============================================================
-- sync_jobs — estado de jobs de sincronización (fire-and-forget)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'partial')),
  total_target INTEGER,
  processed INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  last_offset INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_type_status ON sync_jobs(type, status);

-- 'partial' (DEV-192): un job que avanzó un chunk pero no terminó el catálogo,
-- reanudable desde last_offset. En una DB ya existente, CREATE TABLE IF NOT
-- EXISTS no toca el CHECK viejo: recrearlo de forma idempotente.
ALTER TABLE sync_jobs DROP CONSTRAINT IF EXISTS sync_jobs_status_check;
ALTER TABLE sync_jobs ADD CONSTRAINT sync_jobs_status_check
  CHECK (status IN ('queued', 'running', 'completed', 'failed', 'partial'));

-- ============================================================
-- tax_categories — catálogo de categorías fiscales (IVA)
-- Datos de referencia del sistema (NO de prueba): las alícuotas
-- surgen de la Ley 23.349 (Ley del IVA). Es la fuente de verdad
-- del desglose de IVA. Precios Claros entrega el precio final con
-- IVA incluido y no expone alícuota, así que la clasificamos acá.
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rate NUMERIC(4, 2) NOT NULL,            -- porcentaje: 21.00 | 10.50 | 0.00
  legal_reference TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',  -- match por tokens sobre products.name
  priority INTEGER NOT NULL DEFAULT 100,  -- menor = se evalúa primero (más específica)
  is_fallback BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO tax_categories (id, name, rate, legal_reference, keywords, priority, is_fallback) VALUES
  ('leche', 'Leche fluida', 0.00, 'Ley 23.349 art. 7 inc. f',
    ARRAY['leche entera', 'leche descremada', 'leche fluida', 'leche parcialmente descremada'], 5, FALSE),
  ('libros', 'Libros', 0.00, 'Ley 23.349 art. 7 inc. a',
    ARRAY['libro'], 5, FALSE),
  ('carnes', 'Carnes', 10.50, 'Ley 23.349 art. 28 inc. a',
    ARRAY['carne', 'bife', 'asado', 'milanesa', 'pollo', 'cerdo', 'pescado', 'merluza', 'nalga', 'peceto', 'matambre'], 10, FALSE),
  ('frutas_verduras', 'Frutas y verduras', 10.50, 'Ley 23.349 art. 28 inc. a',
    ARRAY['fruta', 'verdura', 'manzana', 'banana', 'tomate', 'papa', 'cebolla', 'lechuga', 'naranja', 'zanahoria', 'zapallo', 'limon', 'mandarina', 'pera', 'frutilla'], 10, FALSE),
  ('granos_legumbres', 'Granos y legumbres', 10.50, 'Ley 23.349 art. 28 inc. a',
    ARRAY['harina', 'lenteja', 'garbanzo', 'poroto', 'arveja', 'trigo'], 20, FALSE),
  ('pan_comun', 'Pan común', 10.50, 'Ley 23.349 art. 28 inc. a',
    ARRAY['pan comun', 'pan frances', 'pan criollo', 'pan minon'], 10, FALSE),
  ('miel', 'Miel', 10.50, 'Ley 23.349 art. 28 inc. a',
    ARRAY['miel'], 10, FALSE),
  ('general', 'General', 21.00, 'Ley 23.349 art. 28 (alícuota general)',
    ARRAY[]::TEXT[], 999, TRUE)
ON CONFLICT (id) DO NOTHING;

-- products — categoría fiscal asignada + candado de override manual.
-- DEFAULT 'general' garantiza FK válida para filas existentes y nuevas.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tax_category_id TEXT NOT NULL DEFAULT 'general' REFERENCES tax_categories(id),
  ADD COLUMN IF NOT EXISTS tax_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- purchase_items — snapshot inmutable de la alícuota al momento de la compra.
-- Un comprobante emitido no cambia aunque luego se recategorice el producto.
ALTER TABLE purchase_items
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(4, 2) NOT NULL DEFAULT 21.00;

-- ============================================================
-- trigger genérico para mantener updated_at actualizado
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_carts_updated_at ON carts;
CREATE TRIGGER trg_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_lists_updated_at ON lists;
CREATE TRIGGER trg_lists_updated_at BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- crea el perfil en public.users al nacer un usuario en auth.users
-- (cualquier método: email/password, Google, etc.). Patrón oficial de Supabase
-- para perfiles; reemplaza el autocreate lazy del GET /api/users/profile.
-- Ver db/migrations/2026-06-13-handle-new-user-trigger.sql
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
