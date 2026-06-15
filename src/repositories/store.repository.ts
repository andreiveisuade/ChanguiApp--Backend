import supabase from '../config/supabase';

// El endpoint público de stores está parqueado (ver feat/stores-backend). Acá
// solo queda lo que usa el sync: marcar el store sincronizado por su id de
// Precios Claros.
export async function markSyncedByPreciosClarosId(storeId: string): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({ synced_at: new Date().toISOString() })
    .eq('precios_claros_id', storeId);

  if (error) throw error;
}
