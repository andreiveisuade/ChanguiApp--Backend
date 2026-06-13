import type { Request, Response, NextFunction } from 'express';
import * as listService from '../services/list.service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lists = await listService.getLists(req.user!.id);
    res.status(200).json(lists);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await listService.getList(req.user!.id, String(req.params.id));
    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body as { name?: string };
    const created = await listService.createList(req.user!.id, name ?? null);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function rename(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body as { name?: string };
    const updated = await listService.renameList(req.user!.id, String(req.params.id), name ?? null);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await listService.deleteList(req.user!.id, String(req.params.id));
    res.status(200).json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { product_name, barcode, quantity } = req.body as {
      product_name?: string;
      barcode?: string | null;
      quantity?: number | null;
    };
    const item = await listService.addItem(req.user!.id, String(req.params.id), {
      product_name: product_name!,
      barcode: barcode ?? null,
      quantity: quantity ?? null,
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quantity, purchased } = req.body as { quantity?: number; purchased?: boolean };
    const fields: { quantity?: number; purchased?: boolean } = {};
    if (quantity !== undefined) fields.quantity = Number(quantity);
    if (purchased !== undefined) fields.purchased = Boolean(purchased);
    const item = await listService.updateItem(
      req.user!.id,
      String(req.params.id),
      String(req.params.itemId),
      fields
    );
    res.status(200).json(item);
  } catch (err) {
    next(err);
  }
}

export async function removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await listService.deleteItem(req.user!.id, String(req.params.id), String(req.params.itemId));
    res.status(200).json({ deleted: true });
  } catch (err) {
    next(err);
  }
}
