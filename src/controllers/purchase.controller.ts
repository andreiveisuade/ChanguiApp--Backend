import { asyncHandler } from '../utils/asyncHandler';
import { purchaseService } from '../services/purchase.service';
import type { AuthedRequest } from '../types/http';

export const list = asyncHandler<AuthedRequest>(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const purchases = await purchaseService.list(req.user.id, status);
  res.json(purchases);
});

export const getById = asyncHandler<AuthedRequest>(async (req, res) => {
  const purchase = await purchaseService.getById(req.user.id, String(req.params.id));
  res.json(purchase);
});
