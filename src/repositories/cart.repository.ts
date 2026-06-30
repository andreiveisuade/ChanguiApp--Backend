import { supabaseAdmin } from '../config/supabase';
import type { Cart, CartItem, CartWithItems } from '../types/domain';

export async function findActiveCartByUserId(userId: string): Promise<CartWithItems | null> {
  const { data, error } = await supabaseAdmin
    .from('carts')
    .select(
      '*, items:cart_items(*, product:products(*, tax_category:tax_categories(id, name, rate)))',
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data as CartWithItems;
}

export async function createCart(userId: string): Promise<Cart> {
  const { data, error } = await supabaseAdmin
    .from('carts')
    .insert({ user_id: userId, status: 'active' })
    .select()
    .single();

  if (error) throw error;
  return data as Cart;
}

export async function addOrUpdateItem(
  cartId: string,
  productId: string,
  quantity: number,
  unitPrice: number,
): Promise<CartItem> {
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .upsert(
      { cart_id: cartId, product_id: productId, quantity, unit_price: unitPrice },
      { onConflict: 'cart_id,product_id', ignoreDuplicates: false },
    )
    .select()
    .single();

  if (error) throw error;
  return data as CartItem;
}

export type CartItemOwnership = {
  id: string;
  cart_id: string;
  user_id: string | null;
  status: string | null;
};

// Trae solo lo necesario para validar pertenencia (id del item, su carrito y el
// dueño/estado del carrito) en una sola query liviana, sin arrastrar el grafo de
// productos y categorías fiscales como hace findActiveCartByUserId.
export async function findItemOwnership(itemId: string): Promise<CartItemOwnership | null> {
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .select('id, cart_id, cart:carts(user_id, status)')
    .eq('id', itemId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as { id: string; cart_id: string; cart?: { user_id?: string; status?: string } };
  return {
    id: row.id,
    cart_id: row.cart_id,
    user_id: row.cart?.user_id ?? null,
    status: row.cart?.status ?? null,
  };
}

export async function updateItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as CartItem;
}

export async function removeItem(itemId: string): Promise<CartItem> {
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as CartItem;
}

export async function cancelCart(cartId: string): Promise<Cart> {
  const { data, error } = await supabaseAdmin
    .from('carts')
    .update({ status: 'cancelled' })
    .eq('id', cartId)
    .select()
    .single();

  if (error) throw error;
  return data as Cart;
}
