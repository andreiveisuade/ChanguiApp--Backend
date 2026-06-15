-- Crea el perfil en public.users automáticamente cuando nace un usuario en
-- auth.users (cualquier método: email/password, Google, etc.). Es el patrón
-- recomendado por Supabase para perfiles y reemplaza el "autocreate" lazy que
-- vivía dentro de GET /api/users/profile (un anti-patrón: crear en un GET).
--
-- Aditivo, idempotente y seguro de re-correr. Aplicar a mano en el SQL Editor
-- de Supabase.
--
-- Requisito para que funcione bien con múltiples métodos de login: tener el
-- linking de identidades activo (Auth → "Confirm email" desactivado, o emails
-- verificados) para que el mismo email comparta un único auth.users.id y no
-- choque con el UNIQUE de users.email. Ver docs/ARQUITECTURA o el README de auth.

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
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
