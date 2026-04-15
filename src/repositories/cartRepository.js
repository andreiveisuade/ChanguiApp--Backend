const supabase = require('../config/supabase');

async function findActiveCartByUserId(userId) {
  const { data, error } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function createCart(userId, storeId) {
  const { data, error } = await supabase
    .from('carts')
    .insert({ user_id: userId, store_id: storeId, status: 'active' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getCartWithItems(cartId) {
  const { data, error } = await supabase
    .from('carts')
    .select('*, cart_items(*, products(name, brand, image_url))')
    .eq('id', cartId)
    .single();

  if (error) throw error;
  return data;
}

async function addItemToCart(cartId, productId, quantity, unitPrice) {
  const { data, error } = await supabase
    .from('cart_items')
    .upsert(
      { cart_id: cartId, product_id: productId, quantity, unit_price: unitPrice },
      { onConflict: 'cart_id,product_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateItemQuantity(itemId, quantity) {
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function removeItem(itemId) {
  const { data, error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function findItemById(itemId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('id', itemId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

module.exports = {
  findActiveCartByUserId,
  createCart,
  getCartWithItems,
  addItemToCart,
  updateItemQuantity,
  removeItem,
  findItemById,
};

// DEV-20
