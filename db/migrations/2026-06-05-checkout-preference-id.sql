-- DEV-102: correlacionar el checkout con su compra de forma determinista.
-- Aditivo y seguro de re-correr. Aplicar a mano en el SQL Editor de Supabase.

ALTER TABLE carts ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;

CREATE INDEX IF NOT EXISTS idx_purchases_user_preference
  ON purchases(user_id, mp_preference_id);
