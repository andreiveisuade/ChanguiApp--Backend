-- ChanguiApp — Seed de datos de prueba
-- Ejecutar DESPUÉS de schema.sql.

-- ============================================================
-- stores — un supermercado de prueba (MVP: un solo store)
-- ============================================================
INSERT INTO stores (name, chain, address, lat, lng)
VALUES ('Coto Barrio Norte', 'Coto', 'Av. Santa Fe 2000, CABA', -34.594320, -58.398556)
ON CONFLICT DO NOTHING;

-- ============================================================
-- products — productos con barcode real para testing manual
-- ============================================================
INSERT INTO products (barcode, name, brand, price, image_url) VALUES
  ('7790895000782', 'Leche La Serenísima Entera 1L', 'La Serenísima', 850.00, NULL),
  ('7790070410078', 'Coca Cola 2.25L', 'Coca Cola', 2100.00, NULL),
  ('7790580125820', 'Pan Lactal Bimbo 460g', 'Bimbo', 1200.00, NULL),
  ('7791290007604', 'Aceite Natura Girasol 900ml', 'Natura', 1890.00, NULL),
  ('7790040140011', 'Yerba Taragüí 500g', 'Taragüí', 1650.00, NULL)
ON CONFLICT (barcode) DO NOTHING;
