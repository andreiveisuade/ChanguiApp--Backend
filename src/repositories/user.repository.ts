import supabase, { supabaseAdmin } from '../config/supabase';
import type { User, UserUpdate } from '../types/domain';

export async function findById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as User;
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

export async function createUserProfile(userId: string, email: string, name: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([{ id: userId, email, full_name: name }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}
