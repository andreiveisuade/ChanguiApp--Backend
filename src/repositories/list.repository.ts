import supabase from '../config/supabase';
import type { ShoppingList, ShoppingListItem, ShoppingListWithItems } from '../types/domain';

export async function findAllByUserId(userId: string): Promise<ShoppingListWithItems[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*, items:list_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ShoppingListWithItems[];
}

export async function findByIdAndUser(
  listId: string,
  userId: string
): Promise<ShoppingListWithItems | null> {
  const { data, error } = await supabase
    .from('lists')
    .select('*, items:list_items(*)')
    .eq('id', listId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as ShoppingListWithItems | null;
}

export async function createList(userId: string, name: string | null): Promise<ShoppingList> {
  const { data, error } = await supabase
    .from('lists')
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) throw error;
  return data as ShoppingList;
}

export async function updateList(
  listId: string,
  userId: string,
  name: string | null
): Promise<ShoppingList | null> {
  const { data, error } = await supabase
    .from('lists')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', listId)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as ShoppingList | null;
}

export async function deleteList(listId: string, userId: string): Promise<ShoppingList | null> {
  const { data, error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as ShoppingList | null;
}

export async function addItem(
  listId: string,
  item: { product_name: string; barcode?: string | null; quantity?: number | null }
): Promise<ShoppingListItem> {
  const { data, error } = await supabase
    .from('list_items')
    .insert({
      list_id: listId,
      product_name: item.product_name,
      barcode: item.barcode ?? null,
      quantity: item.quantity ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ShoppingListItem;
}

export async function updateItem(
  itemId: string,
  listId: string,
  fields: { quantity?: number; purchased?: boolean }
): Promise<ShoppingListItem | null> {
  const { data, error } = await supabase
    .from('list_items')
    .update(fields)
    .eq('id', itemId)
    .eq('list_id', listId)
    .select()
    .maybeSingle();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as ShoppingListItem | null;
}

export async function deleteItem(itemId: string, listId: string): Promise<ShoppingListItem | null> {
  const { data, error } = await supabase
    .from('list_items')
    .delete()
    .eq('id', itemId)
    .eq('list_id', listId)
    .select()
    .maybeSingle();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as ShoppingListItem | null;
}
