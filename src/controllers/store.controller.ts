import type { Request, Response, NextFunction } from 'express';
import * as storeService from '../services/store.service';
import { ApiError } from '../types/domain';

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { lat, lng } = req.query;
    const hasLat = lat !== undefined;
    const hasLng = lng !== undefined;

    if (hasLat !== hasLng) {
      throw new ApiError('Debés enviar lat y lng juntos, o ninguno.', 400);
    }

    if (hasLat && hasLng) {
      const latNum = parseFloat(String(lat));
      const lngNum = parseFloat(String(lng));

      if (isNaN(latNum) || isNaN(lngNum)) {
        throw new ApiError('lat y lng deben ser números válidos.', 400);
      }

      const stores = await storeService.list(latNum, lngNum);
      res.json(stores);
      return;
    }

    const stores = await storeService.list();
    res.json(stores);
  } catch (err) {
    next(err);
  }
}
