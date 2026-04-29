import supabase from '../config/supabase';
import type { CartWithItems, Purchase, CartItem } from '../types/domain';

export async function findActiveCartByUserId(
  userId: string
): Promise<CartWithItems | null> {
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

  return data as CartWithItems;
}

export async function findCartById(cartId: string): Promise<CartWithItems | null> {
  const { data, error } = await supabase
    .from('carts')
    .select('*, items:cart_items(*, product:products(*))')
    .eq('id', cartId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as CartWithItems;
}

export async function createPurchase(
  purchase: Omit<Purchase, 'id' | 'created_at'>
): Promise<Purchase> {
  const { data, error } = await supabase
    .from('purchases')
    .insert(purchase)
    .select()
    .single();

  if (error) throw error;
  return data as Purchase;
}

export async function insertPurchaseItems(
  purchaseId: string,
  items: CartItem[]
): Promise<void> {
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

export async function closeCart(cartId: string): Promise<void> {
  const { error } = await supabase
    .from('carts')
    .update({ status: 'closed' })
    .eq('id', cartId);

  if (error) throw error;
}
