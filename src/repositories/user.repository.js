const supabase = require('../config/supabase');

async function findById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

async function update(userId, fields) {
  const { data, error } = await supabase
    .from('users')
    .update(fields)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function remove(userId) {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
}

module.exports = { findById, update, remove };
