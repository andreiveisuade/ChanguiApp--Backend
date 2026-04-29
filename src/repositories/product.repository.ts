import supabase from '../config/supabase';
import { supabaseAdmin } from '../config/supabase';
import type { Product } from '../types/domain';

export async function findByBarcode(barcode: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, barcode, name, brand, price, image_url')
    .eq('barcode', barcode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Product;
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
