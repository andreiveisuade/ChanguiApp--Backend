import type { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';

export async function getByBarcode(
  req: Request<{ code: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code } = req.params;
    const product = await productService.getByBarcode(code);
    res.json(product);
  } catch (err) {
    next(err);
  }
}
