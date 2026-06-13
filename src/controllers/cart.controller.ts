import { asyncHandler } from '../utils/asyncHandler';
import * as cartService from '../services/cart.service';

export const getCart = asyncHandler(async (req, res) => {
  const { cart, items, total, summary } = await cartService.getCart(req.user!.id);
  res.status(200).json({ cart, items, total, summary });
});

export const addItem = asyncHandler(async (req, res) => {
  const { product_id, unit_price, store_id, quantity = 1 } = req.body as {
    product_id?: string;
    unit_price?: number;
    store_id?: string;
    quantity?: number;
  };
  const item = await cartService.addItem(req.user!.id, store_id, product_id!, quantity, unit_price!);
  res.status(201).json(item);
});

export const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body as { quantity?: number };
  const result = await cartService.updateItem(req.user!.id, String(req.params.id), Number(quantity));
  if (result === null) {
    res.status(200).json({ message: 'Item eliminado del carrito' });
    return;
  }
  res.status(200).json(result);
});

export const removeItem = asyncHandler(async (req, res) => {
  const item = await cartService.removeItem(req.user!.id, String(req.params.id));
  res.status(200).json(item);
});

export const cancelCart = asyncHandler(async (req, res) => {
  const cart = await cartService.cancelCart(req.user!.id);
  res.status(200).json(cart);
});
