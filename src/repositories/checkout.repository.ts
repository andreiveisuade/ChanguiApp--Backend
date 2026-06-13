import supabase from '../config/supabase';
import type { CartWithItems, Purchase } from '../types/domain';

// Fila lista para insertar en purchase_items. La arma el service (es lógica de
// negocio: fallbacks de nombre/barcode y la tasa de IVA); el repo solo persiste.
export interface PurchaseItemRow {
  purchase_id: string;
  product_name: string;
  barcode: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

export async function savePreferenceId(
  cartId: string,
  preferenceId: string
): Promise<void> {
  const { error } = await supabase
    .from('carts')
    .update({ mp_preference_id: preferenceId })
    .eq('id', cartId);

  if (error) throw error;
}

export async function findPurchaseByPreferenceId(
  userId: string,
  preferenceId: string
): Promise<Purchase | null> {
  const { data, error } = await supabase
    .from('purchases')
    .select('id, total, payment_id, payment_status, created_at, store_id, mp_preference_id')
    .eq('user_id', userId)
    .eq('mp_preference_id', preferenceId)
    .maybeSingle();

  if (error) throw error;
  return (data as Purchase) || null;
}

export async function findCartById(cartId: string): Promise<CartWithItems | null> {
  const { data, error } = await supabase
    .from('carts')
    .select('*, items:cart_items(*, product:products(*, tax_category:tax_categories(id, name, rate)))')
    .eq('id', cartId)
    .maybeSingle();

  if (error) throw error;
  return (data as CartWithItems) ?? null;
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

export async function insertPurchaseItems(rows: PurchaseItemRow[]): Promise<void> {
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
