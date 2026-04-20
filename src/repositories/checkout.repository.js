const supabase = require('../config/supabase');

async function findActiveCartByUserId(userId) {
  const { data, error } = await supabase
    .from('carts')
    .select('*, items:cart_items(*, product:products(*))')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

async function findCartById(cartId) {
  const { data, error } = await supabase
    .from('carts')
    .select('*, items:cart_items(*, product:products(*))')
    .eq('id', cartId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

async function createPurchase(purchase) {
  const { data, error } = await supabase
    .from('purchases')
    .insert(purchase)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function insertPurchaseItems(purchaseId, items) {
  const rows = items.map((i) => ({
    purchase_id: purchaseId,
    product_name: i.product?.name || 'Producto',
    barcode: i.product?.barcode || '',
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));

  const { error } = await supabase.from('purchase_items').insert(rows);
  if (error) throw error;
}

async function closeCart(cartId) {
  const { data, error } = await supabase
    .from('carts')
    .update({ status: 'closed' })
    .eq('id', cartId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  findActiveCartByUserId,
  findCartById,
  createPurchase,
  insertPurchaseItems,
  closeCart,
};
