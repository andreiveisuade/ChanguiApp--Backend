import * as listRepository from '../repositories/list.repository';
import {
  ApiError,
  type ShoppingList,
  type ShoppingListItem,
  type ShoppingListWithItems,
} from '../types/domain';

export async function getLists(userId: string): Promise<ShoppingListWithItems[]> {
  return listRepository.findAllByUserId(userId);
}

export async function getList(userId: string, listId: string): Promise<ShoppingListWithItems> {
  const list = await listRepository.findByIdAndUser(listId, userId);
  if (!list) throw new ApiError('Lista no encontrada', 404);
  return list;
}

export async function createList(userId: string, name: string | null): Promise<ShoppingList> {
  return listRepository.createList(userId, name ?? null);
}

export async function renameList(
  userId: string,
  listId: string,
  name: string | null
): Promise<ShoppingList> {
  const updated = await listRepository.updateList(listId, userId, name ?? null);
  if (!updated) throw new ApiError('Lista no encontrada', 404);
  return updated;
}

export async function deleteList(userId: string, listId: string): Promise<ShoppingList> {
  const deleted = await listRepository.deleteList(listId, userId);
  if (!deleted) throw new ApiError('Lista no encontrada', 404);
  return deleted;
}

// Verifica que la lista exista y sea del usuario antes de tocar sus items.
async function assertOwnsList(userId: string, listId: string): Promise<void> {
  const list = await listRepository.findByIdAndUser(listId, userId);
  if (!list) throw new ApiError('Lista no encontrada', 404);
}

export async function addItem(
  userId: string,
  listId: string,
  item: { product_name: string; barcode?: string | null; quantity?: number | null }
): Promise<ShoppingListItem> {
  await assertOwnsList(userId, listId);
  return listRepository.addItem(listId, item);
}

export async function updateItem(
  userId: string,
  listId: string,
  itemId: string,
  fields: { quantity?: number; purchased?: boolean }
): Promise<ShoppingListItem> {
  await assertOwnsList(userId, listId);
  const updated = await listRepository.updateItem(itemId, listId, fields);
  if (!updated) throw new ApiError('Item no encontrado', 404);
  return updated;
}

export async function deleteItem(
  userId: string,
  listId: string,
  itemId: string
): Promise<ShoppingListItem> {
  await assertOwnsList(userId, listId);
  const deleted = await listRepository.deleteItem(itemId, listId);
  if (!deleted) throw new ApiError('Item no encontrado', 404);
  return deleted;
}
