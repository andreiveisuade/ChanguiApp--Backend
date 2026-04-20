import supabase from '../config/supabase';
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
