import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente estándar: valida JWTs de usuarios. Respeta RLS.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin: usa service_role key. Bypassa RLS.
// SOLO usar en repositories de operaciones administrativas (sync, seeds, limpieza).
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Mantener default export para backward-compatibility con repositorios existentes
// que hacen `import supabase from '../config/supabase'` (usan service_role key).
export default supabase;
