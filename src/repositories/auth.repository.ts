import { supabaseAuth } from '../config/supabase';

// Usa el cliente supabaseAuth (anon + persistSession:false) en lugar del
// cliente admin para evitar contaminar la sesion del cliente compartido.
export async function register(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
