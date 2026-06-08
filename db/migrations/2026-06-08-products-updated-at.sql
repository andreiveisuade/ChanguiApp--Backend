-- DEV-190: catalogo incremental para cache local del frontend.
-- Aditivo y seguro de re-correr. Aplicar a mano en el SQL Editor de Supabase
-- ANTES de deployar el codigo que lee products.updated_at.

-- 1) Columna de ultima modificacion. Default NOW() para filas existentes.
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2) Trigger: solo toca updated_at cuando un campo relevante cambia de verdad.
--    El sync re-upsertea TODO el catalogo cada dia; sin este IS DISTINCT FROM,
--    todas las filas figurarian como "modificadas" y el delta seria el catalogo
--    entero (no habria nada incremental).
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

-- 3) Indice para el filtro updated_at > cursor del sync incremental.
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);
