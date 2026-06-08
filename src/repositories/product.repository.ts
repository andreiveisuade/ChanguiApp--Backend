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

export interface CatalogProduct {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  price: number;
  image_url: string | null;
  updated_at: string;
  // Embed de la categoría fiscal para calcular el IVA del producto en el catálogo.
  tax_category: { name: string; rate: number } | null;
}

// Catálogo para el cache local del front: filas con updated_at > since,
// ordenadas para paginar de forma estable. Supabase limita a 1000 por query.
export async function findUpdatedSince(
  since: string,
  limit: number,
  offset: number,
): Promise<CatalogProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, barcode, name, brand, price, image_url, updated_at, tax_category:tax_categories(name, rate)',
    )
    .gt('updated_at', since)
    .order('updated_at', { ascending: true })
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Supabase tipa el embed to-one como array; en runtime es un objeto único.
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const raw = r.tax_category;
    r.tax_category = Array.isArray(raw) ? raw[0] ?? null : raw ?? null;
    return r as unknown as CatalogProduct;
  });
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
// Supabase limita a 1000 filas por query, así que se pagina con range().
export async function getAllForClassification(): Promise<Array<{ id: string; name: string }>> {
  const PAGE_SIZE = 1000;
  const all: Array<{ id: string; name: string }> = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('tax_locked', false)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const rows = (data ?? []) as Array<{ id: string; name: string }>;
    all.push(...rows);

    if (rows.length < PAGE_SIZE) break;
  }

  return all;
}

export async function bulkSetCategory(categoryId: string, productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;

  // Supabase manda los ids en la URL; con miles de ids la query excede el
  // límite y devuelve "Bad Request". Por eso se actualiza en chunks.
  const CHUNK_SIZE = 200;
  for (let i = 0; i < productIds.length; i += CHUNK_SIZE) {
    const chunk = productIds.slice(i, i + CHUNK_SIZE);
    const { error } = await supabaseAdmin
      .from('products')
      .update({ tax_category_id: categoryId })
      .in('id', chunk)
      .eq('tax_locked', false);

    if (error) throw error;
  }
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
