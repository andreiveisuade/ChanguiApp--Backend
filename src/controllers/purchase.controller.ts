import { asyncHandler } from '../utils/asyncHandler';
import * as purchaseService from '../services/purchase.service';

export const list = asyncHandler(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const purchases = await purchaseService.list(req.user!.id, status);
  res.json(purchases);
});

export const getById = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.getById(req.user!.id, String(req.params.id));
  res.json(purchase);
});
