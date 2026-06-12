import supabase from '../config/supabase';
import type { Store } from '../types/domain';

export async function findAll(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, chain, address, lat, lng');

  if (error) throw error;
  return (data as Store[]) ?? [];
}

export async function markSyncedByPreciosClarosId(storeId: string): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({ synced_at: new Date().toISOString() })
    .eq('precios_claros_id', storeId);

  if (error) throw error;
}
