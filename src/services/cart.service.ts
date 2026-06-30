import * as cartRepository from '../repositories/cart.repository';
import { summarizeByRate, itemsTotal, DEFAULT_TAX_RATE } from './pricing.service';
import { ApiError } from '../utils/ApiError';
import type { Cart, CartItem, CartWithItems, TaxSummary } from '../types/domain';

export async function getCart(userId: string): Promise<{
  cart: CartWithItems | null;
  items: CartItem[];
  total: number;
  summary: TaxSummary;
}> {
  const cart = await cartRepository.findActiveCartByUserId(userId);
  if (!cart) {
    return { cart: null, items: [], total: 0, summary: { subtotal_net: 0, taxes: [], total: 0 } };
  }
  const items = cart.items ?? [];
  const total = itemsTotal(items);
  const summary = summarizeByRate(
    items.map((i) => ({
      lineTotal: i.unit_price * i.quantity,
      rate: i.product?.tax_category?.rate ?? DEFAULT_TAX_RATE,
    })),
  );
  return { cart, items, total, summary };
}

export async function addItem(
  userId: string,
  productId: string,
  quantity: number,
  unitPrice: number,
): Promise<CartItem> {
  let cart = await cartRepository.findActiveCartByUserId(userId);
  if (!cart) {
    cart = await cartRepository.createCart(userId);
  }
  return cartRepository.addOrUpdateItem(cart.id, productId, quantity, unitPrice);
}

// Valida que el item exista (404) y pertenezca al carrito activo del usuario
// (403). Comparte el control de permisos entre updateItem y removeItem.
// Una sola query liviana: no hace falta traer el carrito completo para comparar.
async function assertItemBelongsToUser(userId: string, itemId: string): Promise<void> {
  const ownership = await cartRepository.findItemOwnership(itemId);
  if (!ownership) throw new ApiError('Item no encontrado', 404);
  if (ownership.user_id !== userId || ownership.status !== 'active') {
    throw new ApiError('No tenés permiso para modificar este item', 403);
  }
}

export async function updateItem(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<CartItem | null> {
  await assertItemBelongsToUser(userId, itemId);
  if (quantity <= 0) {
    await cartRepository.removeItem(itemId);
    return null;
  }
  return cartRepository.updateItemQuantity(itemId, quantity);
}

export async function removeItem(userId: string, itemId: string): Promise<CartItem> {
  await assertItemBelongsToUser(userId, itemId);
  return cartRepository.removeItem(itemId);
}

export async function cancelCart(userId: string): Promise<Cart> {
  const cart = await cartRepository.findActiveCartByUserId(userId);
  if (!cart) throw new ApiError('No hay carrito activo', 404);
  return cartRepository.cancelCart(cart.id);
}
