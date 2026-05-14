import supabase from '../config/supabase';
import type { Store } from '../types/domain';

export async function findAll(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, chain, address, lat, lng');

  if (error) throw error;
  return (data as Store[]) ?? [];
}
