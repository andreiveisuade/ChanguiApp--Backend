import type { Request, Response, NextFunction } from 'express';
import * as purchaseService from '../services/purchase.service';

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const purchases = await purchaseService.list(req.user!.id, status);
    res.json(purchases);
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const purchase = await purchaseService.getById(req.user!.id, req.params.id);
    res.json(purchase);
  } catch (err) {
    next(err);
  }
}
