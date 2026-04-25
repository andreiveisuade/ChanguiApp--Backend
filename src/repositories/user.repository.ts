import { supabaseAdmin } from '../config/supabase';

export const userRepository = {
  async createUserProfile(userId: string, email: string, name: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{ id: userId, email, name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = No rows found
    return data || null;
  }
};