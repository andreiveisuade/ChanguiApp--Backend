import * as purchaseRepository from '../repositories/purchase.repository';
import { summarizeByRate } from './pricing.service';
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

  const items = purchase.items ?? [];
  // Desglose con la alícuota congelada en el ticket, no la categoría actual.
  const summary = summarizeByRate(
    items.map((i) => ({ lineTotal: i.unit_price * i.quantity, rate: i.tax_rate }))
  );

  return { ...purchase, summary };
}
