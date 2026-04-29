import type { Request, Response, NextFunction } from 'express';
import * as cartService from '../services/cart.service';

export async function getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cart, items, total } = await cartService.getCart(req.user!.id);
    res.status(200).json({ cart, items, total });
  } catch (err) {
    next(err);
  }
}

export async function addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { product_id, unit_price, store_id, quantity = 1 } = req.body as {
      product_id?: string;
      unit_price?: number;
      store_id?: string;
      quantity?: number;
    };
    if (!product_id) {
      res.status(400).json({ error: 'product_id es requerido' });
      return;
    }
    if (unit_price === undefined) {
      res.status(400).json({ error: 'unit_price es requerido' });
      return;
    }
    const item = await cartService.addItem(req.user!.id, store_id, product_id, quantity, unit_price);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quantity } = req.body as { quantity?: number };
    if (quantity === undefined) {
      res.status(400).json({ error: 'quantity es requerido' });
      return;
    }
    const result = await cartService.updateItem(req.user!.id, String(req.params.id), Number(quantity));
    if (result === null) {
      res.status(200).json({ message: 'Item eliminado del carrito' });
      return;
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await cartService.removeItem(req.user!.id, String(req.params.id));
    res.status(200).json(item);
  } catch (err) {
    next(err);
  }
}

export async function cancelCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cart = await cartService.cancelCart(req.user!.id);
    res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
}
