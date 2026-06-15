import * as purchaseRepository from '../repositories/purchase.repository';
import { summarizeByRate } from './pricing.service';
import { ApiError } from '../utils/ApiError';
import type { Purchase, PurchaseDetail } from '../types/domain';

// DIP (ejemplo): el service —alto nivel— depende de esta abstracción, no del
// repositorio concreto de Supabase. La interfaz la declara el consumidor (es lo
// que el service necesita), así el origen de datos se puede sustituir (otro
// backend, un fake en tests) sin tocar la lógica de negocio.
// El resto de los services usa módulos de funciones a propósito (pragmático para
// el MVP); este queda como muestra del patrón.
export interface PurchaseRepository {
  findByUserId(userId: string, status?: string): Promise<Purchase[]>;
  findByIdAndUser(purchaseId: string, userId: string): Promise<PurchaseDetail | null>;
}

export class PurchaseService {
  constructor(private readonly repo: PurchaseRepository) {}

  async list(userId: string, status?: string): Promise<Purchase[]> {
    return this.repo.findByUserId(userId, status);
  }

  async getById(userId: string, purchaseId: string): Promise<PurchaseDetail> {
    const purchase = await this.repo.findByIdAndUser(purchaseId, userId);
    if (!purchase) {
      throw new ApiError('Compra no encontrada', 404);
    }

    const items = purchase.items ?? [];
    // Desglose con la alícuota congelada en el ticket, no la categoría actual.
    const summary = summarizeByRate(
      items.map((i) => ({ lineTotal: i.unit_price * i.quantity, rate: i.tax_rate })),
    );

    return { ...purchase, summary };
  }
}

// Composition root: instancia default cableada con el repo concreto (Supabase).
// Los controllers usan esta instancia; los tests inyectan un fake.
export const purchaseService = new PurchaseService(purchaseRepository);
