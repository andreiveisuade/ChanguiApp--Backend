import type { Request, Response } from 'express';
import * as syncService from '../services/sync.service';

export async function syncPreciosClarosHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const adminToken = process.env.ADMIN_TOKEN;
  const provided = req.headers['x-admin-token'];

  if (!provided || provided !== adminToken) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const stats = await syncService.syncPreciosClaros();
    res.json(stats);
  } catch (err) {
    console.error('[admin] sync-precios-claros failed:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
}
