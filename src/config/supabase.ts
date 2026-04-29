import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Opciones comunes para clientes server-side: no persistir sesion ni
// auto-refresh (innecesarios fuera del browser).
const serverSideAuth = {
  auth: { autoRefreshToken: false, persistSession: false },
};

// Cliente dedicado a VALIDAR tokens del usuario (auth.getUser).
// Es importante que sea una instancia SEPARADA porque
// supabase-js guarda internamente el token validado como "sesion" del cliente,
// y eso contamina queries posteriores que necesitan service_role para
// bypassear RLS.
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, serverSideAuth);

// Cliente con service_role. Bypassa RLS. Es el cliente para todos los
// repositorios (queries de stores, products, cart, etc.). NUNCA llamar
// .auth.* en este cliente — usar supabaseAuth para eso.
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  serverSideAuth,
);

// Aliases de compatibilidad. `supabase` (default + named) apunta al cliente
// de queries (admin). El cliente de auth se importa explicitamente como
// supabaseAuth.
export const supabase = supabaseAdmin;
export default supabaseAdmin;
