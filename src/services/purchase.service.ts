import * as purchaseRepository from '../repositories/purchase.repository';
import { ApiError, type Purchase, type PurchaseDetail } from '../types/domain';

export async function list(userId: string, status?: string): Promise<Purchase[]> {
  return purchaseRepository.findByUserId(userId, status);
}

export async function getById(
  userId: string,
  purchaseId: string
): Promise<PurchaseDetail> {
  const purchase = await purchaseRepository.findByIdAndUser(purchaseId, userId);
  if (!purchase) {
    throw new ApiError('Compra no encontrada', 404);
  }
  return purchase;
}
