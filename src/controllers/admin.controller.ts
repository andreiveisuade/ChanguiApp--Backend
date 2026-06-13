import { asyncHandler } from '../utils/asyncHandler';
import * as syncService from '../services/sync.service';
import * as syncJobsRepository from '../repositories/sync_jobs.repository';
import * as classificationService from '../services/classification.service';
import { ApiError } from '../types/domain';

export const startSyncPreciosClaros = asyncHandler(async (_req, res) => {
  const { sync_id } = await syncService.startPreciosClarosSync();
  res.status(202).json({ sync_id });
});

export const getSyncPreciosClarosStatus = asyncHandler(async (req, res) => {
  const job = await syncJobsRepository.findById(String(req.params.id));
  if (!job) {
    throw new ApiError('Sync no encontrado', 404);
  }
  res.json(job);
});

export const ingestProducts = asyncHandler(async (req, res) => {
  const productos = req.body?.productos;
  if (!Array.isArray(productos)) {
    throw new ApiError('productos debe ser un array', 400);
  }

  const upserted = await syncService.ingestProductsBatch(productos);
  res.json({ upserted });
});

export const overrideTaxCategory = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const categoryId = req.body?.category_id;
  if (!categoryId || typeof categoryId !== 'string') {
    throw new ApiError('category_id es requerido', 400);
  }

  const result = await classificationService.overrideTaxCategory(String(barcode), categoryId);
  res.json(result);
});

export const reclassify = asyncHandler(async (_req, res) => {
  const result = await classificationService.reclassifyAll();
  res.json(result);
});
