import { supabaseAdmin } from '../config/supabase';
import type { Purchase, PurchaseDetail } from '../types/domain';

export async function findByUserId(userId: string, status?: string): Promise<Purchase[]> {
  let query = supabaseAdmin
    .from('purchases')
    .select('id, total, payment_id, payment_status, created_at')
    .eq('user_id', userId);

  if (status) query = query.eq('payment_status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Purchase[]) || [];
}

export async function findByIdAndUser(
  purchaseId: string,
  userId: string,
): Promise<PurchaseDetail | null> {
  const { data, error } = await supabaseAdmin
    .from('purchases')
    .select('*, items:purchase_items(*)')
    .eq('id', purchaseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as PurchaseDetail) ?? null;
}
