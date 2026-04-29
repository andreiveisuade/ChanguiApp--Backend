import * as cartRepository from '../repositories/cart.repository';
import { ApiError, type Cart, type CartItem, type CartWithItems } from '../types/domain';

export async function getCart(
  userId: string
): Promise<{ cart: CartWithItems | null; items: CartItem[]; total: number }> {
  const cart = await cartRepository.findActiveCartByUserId(userId);
  if (!cart) return { cart: null, items: [], total: 0 };
  const items = cart.items ?? [];
  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  return { cart, items, total };
}

export async function addItem(
  userId: string,
  storeId: string | undefined,
  productId: string,
  quantity: number,
  unitPrice: number
): Promise<CartItem> {
  let cart = await cartRepository.findActiveCartByUserId(userId);
  if (!cart && !storeId) {
    throw new ApiError('storeId es requerido para crear un nuevo carrito', 400);
  }
  if (!cart) {
    cart = await cartRepository.createCart(userId, storeId!);
  }
  return cartRepository.addOrUpdateItem(cart.id, productId, quantity, unitPrice);
}

export async function updateItem(
  userId: string,
  itemId: string,
  quantity: number
): Promise<CartItem | null> {
  const item = await cartRepository.findItemById(itemId);
  if (!item) throw new ApiError('Item no encontrado', 404);
  const cart = await cartRepository.findActiveCartByUserId(userId);
  if (!cart || item.cart_id !== cart.id) {
    throw new ApiError('No tenés permiso para modificar este item', 403);
  }
  if (quantity <= 0) {
    await cartRepository.removeItem(itemId);
    return null;
  }
  return cartRepository.updateItemQuantity(itemId, quantity);
}

export async function removeItem(userId: string, itemId: string): Promise<CartItem> {
  const item = await cartRepository.findItemById(itemId);
  if (!item) throw new ApiError('Item no encontrado', 404);
  const cart = await cartRepository.findActiveCartByUserId(userId);
  if (!cart || item.cart_id !== cart.id) {
    throw new ApiError('No tenés permiso para eliminar este item', 403);
  }
  return cartRepository.removeItem(itemId);
}

export async function cancelCart(userId: string): Promise<Cart> {
  const cart = await cartRepository.findActiveCartByUserId(userId);
  if (!cart) throw new ApiError('No hay carrito activo', 404);
  return cartRepository.cancelCart(cart.id);
}
