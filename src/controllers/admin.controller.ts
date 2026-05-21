import type { Request, Response, NextFunction } from 'express';
import * as syncService from '../services/sync.service';
import * as syncJobsRepository from '../repositories/sync_jobs.repository';
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
