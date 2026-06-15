import type { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';

export async function getByBarcode(
  req: Request<{ code: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { code } = req.params;
    const product = await productService.getByBarcode(code);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function getCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { updated_since, limit, offset } = req.query;
    const page = await productService.getCatalogSince(
      updated_since !== undefined ? String(updated_since) : undefined,
      limit !== undefined ? Number(limit) : undefined,
      offset !== undefined ? Number(offset) : undefined,
    );
    res.json(page);
  } catch (err) {
    next(err);
  }
}
