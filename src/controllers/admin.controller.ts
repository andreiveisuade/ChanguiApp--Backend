import type { Request, Response, NextFunction } from 'express';
import * as syncService from '../services/sync.service';
import * as syncJobsRepository from '../repositories/sync_jobs.repository';
import * as classificationService from '../services/classification.service';
import { ApiError } from '../types/domain';

export async function startSyncPreciosClarosHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sync_id } = await syncService.startPreciosClarosSync();
    res.status(202).json({ sync_id });
  } catch (err) {
    next(err);
  }
}

export async function getSyncPreciosClarosStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const job = await syncJobsRepository.findById(String(req.params.id));
    if (!job) {
      throw new ApiError('Sync no encontrado', 404);
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
}

export async function ingestProductsHandler(
  req: Request<unknown, unknown, { productos?: syncService.PreciosClarosProduct[] }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const productos = req.body?.productos;
    if (!Array.isArray(productos)) {
      throw new ApiError('productos debe ser un array', 400);
    }

    const upserted = await syncService.ingestProductsBatch(productos);
    res.json({ upserted });
  } catch (err) {
    next(err);
  }
}

export async function overrideTaxCategoryHandler(
  req: Request<{ barcode: string }, unknown, { category_id?: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { barcode } = req.params;
    const categoryId = req.body?.category_id;
    if (!categoryId || typeof categoryId !== 'string') {
      throw new ApiError('category_id es requerido', 400);
    }

    const result = await classificationService.overrideTaxCategory(barcode, categoryId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function reclassifyHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await classificationService.reclassifyAll();
    res.json(result);
  } catch (err) {
    next(err);
  }
}
