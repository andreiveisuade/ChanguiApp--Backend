import supabase from '../config/supabase';
import type { Cart, CartItem, CartWithItems } from '../types/domain';

export async function findActiveCartByUserId(userId: string): Promise<CartWithItems | null> {
  const { data, error } = await supabase
    .from('carts')
    .select('*, items:cart_items(*, product:products(*))')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as CartWithItems;
}

export async function createCart(userId: string, storeId: string): Promise<Cart> {
  const { data, error } = await supabase
    .from('carts')
    .insert({ user_id: userId, store_id: storeId, status: 'active' })
    .select()
    .single();

  if (error) throw error;
  return data as Cart;
}

export async function addOrUpdateItem(
  cartId: string,
  productId: string,
  quantity: number,
  unitPrice: number
): Promise<CartItem> {
  const { data, error } = await supabase
    .from('cart_items')
    .upsert(
      { cart_id: cartId, product_id: productId, quantity, unit_price: unitPrice },
      { onConflict: 'cart_id,product_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) throw error;
  return data as CartItem;
}

export async function findItemById(itemId: string): Promise<CartItem | null> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('id', itemId)
    .maybeSingle();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as CartItem | null;
}

export async function updateItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as CartItem;
}

export async function removeItem(itemId: string): Promise<CartItem> {
  const { data, error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as CartItem;
}

export async function cancelCart(cartId: string): Promise<Cart> {
  const { data, error } = await supabase
    .from('carts')
    .update({ status: 'cancelled' })
    .eq('id', cartId)
    .select()
    .single();

  if (error) throw error;
  return data as Cart;
}
