import supabase, { supabaseAdmin } from '../config/supabase';
import type { User, UserUpdate } from '../types/domain';

export async function findById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as User) ?? null;
}

export async function update(userId: string, fields: UserUpdate): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(fields)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function remove(userId: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
}

/** Elimina al usuario de Supabase Auth (auth.users). Requiere service_role. */
export async function removeAuthUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function createUserProfile(
  userId: string,
  email: string,
  name: string,
): Promise<User> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([{ id: userId, email, full_name: name }])
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function findByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return (data as User) ?? null;
}
