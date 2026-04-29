import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Debug temporal de env vars en startup (sacar despues de validar deploy)
const mask = (s: string | undefined) =>
  s ? `${s.slice(0, 20)}...(${s.length} chars)` : '(undefined)';
console.log('[supabase config]');
console.log('  SUPABASE_URL              =', mask(process.env.SUPABASE_URL));
console.log('  SUPABASE_ANON_KEY         =', mask(process.env.SUPABASE_ANON_KEY));
console.log('  SUPABASE_SERVICE_ROLE_KEY =', mask(process.env.SUPABASE_SERVICE_ROLE_KEY));

// Cliente con anon key. Respeta RLS. Solo usar si necesitamos validar
// JWTs explicitamente (auth middleware con supabase.auth.getUser).
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Cliente con service_role. Bypassa RLS. Es el cliente por default
// para los repositorios del backend porque el control de acceso ya
// se hace a nivel de aplicacion (auth middleware + filtrado por
// user_id en cada query). RLS protege contra acceso directo a la DB
// con anon key, no contra el backend.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Alias para compatibilidad con codigo existente que usa `supabase`.
export const supabase = supabaseAdmin;
export default supabaseAdmin;
