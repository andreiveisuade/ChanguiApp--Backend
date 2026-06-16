import { supabaseAdmin } from '../config/supabase';
import type { TaxCategory } from '../types/domain';

export async function getAll(): Promise<TaxCategory[]> {
  const { data, error } = await supabaseAdmin
    .from('tax_categories')
    .select('id, name, rate, legal_reference, keywords, priority, is_fallback')
    .order('priority', { ascending: true });

  if (error) throw error;

  return (data ?? []) as TaxCategory[];
}
