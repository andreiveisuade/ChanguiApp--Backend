const supabase = require('../config/supabase');

async function findByUserId(userId, status) {
  let query = supabase
    .from('purchases')
    .select('id, total, payment_id, payment_status, created_at, store_id')
    .eq('user_id', userId);

  if (status) query = query.eq('payment_status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function findByIdAndUser(purchaseId, userId) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, items:purchase_items(*)')
    .eq('id', purchaseId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

module.exports = { findByUserId, findByIdAndUser };
