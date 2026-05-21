import { supabaseAdmin } from '../config/supabase';
import type { SyncJob } from '../types/domain';

const COLUMNS =
  'id, type, status, total_target, processed, errors, last_offset, error_message, started_at, completed_at, created_at';

export async function create(type: string): Promise<SyncJob> {
  const { data, error } = await supabaseAdmin
    .from('sync_jobs')
    .insert({ type, status: 'running' })
    .select(COLUMNS)
    .single();

  if (error) throw error;
  return data as SyncJob;
}

export async function findById(id: string): Promise<SyncJob | null> {
  const { data, error } = await supabaseAdmin
    .from('sync_jobs')
    .select(COLUMNS)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as SyncJob;
}

export async function findRunning(type: string): Promise<SyncJob | null> {
  const { data, error } = await supabaseAdmin
    .from('sync_jobs')
    .select(COLUMNS)
    .eq('type', type)
    .eq('status', 'running')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as SyncJob | null) ?? null;
}

export async function setTotal(id: string, total: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from('sync_jobs')
    .update({ total_target: total })
    .eq('id', id);
  if (error) throw error;
}

export async function updateProgress(
  id: string,
  processed: number,
  lastOffset: number,
  errors: number,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('sync_jobs')
    .update({ processed, last_offset: lastOffset, errors })
    .eq('id', id);
  if (error) throw error;
}

export async function markCompleted(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('sync_jobs')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markFailed(id: string, message: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('sync_jobs')
    .update({
      status: 'failed',
      error_message: message,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}
