import { asyncHandler } from '../utils/asyncHandler';
import * as cartService from '../services/cart.service';
import type { AuthedRequest } from '../types/http';

export const getCart = asyncHandler<AuthedRequest>(async (req, res) => {
  const { cart, items, total, summary } = await cartService.getCart(req.user.id);
  res.json({ cart, items, total, summary });
});

export const addItem = asyncHandler<AuthedRequest>(async (req, res) => {
  const { product_id, unit_price, store_id, quantity = 1 } = req.body as {
    product_id?: string;
    unit_price?: number;
    store_id?: string;
    quantity?: number;
  };
  const item = await cartService.addItem(req.user.id, store_id, product_id!, quantity, unit_price!);
  res.status(201).json(item);
});

export const updateItem = asyncHandler<AuthedRequest>(async (req, res) => {
  const { quantity } = req.body as { quantity?: number };
  const result = await cartService.updateItem(req.user.id, String(req.params.id), Number(quantity));
  if (result === null) {
    res.json({ message: 'Item eliminado del carrito' });
    return;
  }
  res.json(result);
});

export const removeItem = asyncHandler<AuthedRequest>(async (req, res) => {
  const item = await cartService.removeItem(req.user.id, String(req.params.id));
  res.json(item);
});

export const cancelCart = asyncHandler<AuthedRequest>(async (req, res) => {
  const cart = await cartService.cancelCart(req.user.id);
  res.json(cart);
});
