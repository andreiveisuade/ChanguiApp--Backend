import type { Request, Response, NextFunction } from 'express';
import * as syncService from '../services/sync.service';
import * as syncJobsRepository from '../repositories/sync_jobs.repository';
import * as productRepository from '../repositories/product.repository';
import * as taxCategoriesRepository from '../repositories/tax_categories.repository';
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

    const categories = await taxCategoriesRepository.getAll();
    if (!categories.some((c) => c.id === categoryId)) {
      throw new ApiError('Categoría fiscal inválida', 400);
    }

    const { updated } = await productRepository.updateTaxCategory(barcode, categoryId);
    if (!updated) {
      throw new ApiError('Producto no encontrado', 404);
    }

    res.json({ barcode, tax_category_id: categoryId, tax_locked: true });
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
