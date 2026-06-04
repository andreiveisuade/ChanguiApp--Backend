import supabase from '../config/supabase';
import { supabaseAdmin } from '../config/supabase';
import type { Product } from '../types/domain';

export async function findByBarcode(barcode: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, barcode, name, brand, price, image_url, tax_category_id, tax_locked, tax_category:tax_categories(id, name, rate)',
    )
    .eq('barcode', barcode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  if (!data) return null;

  // Supabase tipa el embed to-one como array; en runtime es un objeto único.
  const row = data as Record<string, unknown>;
  const rawCategory = row.tax_category;
  row.tax_category = Array.isArray(rawCategory) ? rawCategory[0] ?? null : rawCategory ?? null;

  return row as unknown as Product;
}

export async function upsertByBarcode(product: {
  barcode: string;
  name: string;
  brand?: string;
  price: number;
  image_url?: string;
}): Promise<{ created: boolean }> {
  const existing = await findByBarcode(product.barcode);

  const { error } = await supabaseAdmin
    .from('products')
    .upsert(product, { onConflict: 'barcode' });

  if (error) throw error;

  return { created: !existing };
}

export interface ProductUpsertInput {
  barcode: string;
  name: string;
  brand?: string;
  price: number;
  image_url?: string;
}

export async function upsertBatch(products: ProductUpsertInput[]): Promise<void> {
  if (products.length === 0) return;

  const { error } = await supabaseAdmin
    .from('products')
    .upsert(products, { onConflict: 'barcode' });

  if (error) throw error;
}

// Productos sin candado de override, para reclasificar por categoría fiscal.
export async function getAllForClassification(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name')
    .eq('tax_locked', false);

  if (error) throw error;

  return (data ?? []) as Array<{ id: string; name: string }>;
}

export async function bulkSetCategory(categoryId: string, productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;

  const { error } = await supabaseAdmin
    .from('products')
    .update({ tax_category_id: categoryId })
    .in('id', productIds)
    .eq('tax_locked', false);

  if (error) throw error;
}

// Override manual: fija la categoría y bloquea el producto para que el sync no lo pise.
export async function updateTaxCategory(
  barcode: string,
  categoryId: string,
): Promise<{ updated: boolean }> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ tax_category_id: categoryId, tax_locked: true })
    .eq('barcode', barcode)
    .select('id')
    .maybeSingle();

  if (error) throw error;

  return { updated: !!data };
}
