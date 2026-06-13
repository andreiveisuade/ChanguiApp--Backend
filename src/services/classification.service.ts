import * as productRepository from '../repositories/product.repository';
import * as taxCategoriesRepository from '../repositories/tax_categories.repository';
import { ApiError } from '../utils/ApiError';
import type { TaxCategory } from '../types/domain';

// Match por tokens: la keyword matchea si TODAS sus palabras están en el
// nombre, en cualquier orden. Así "leche entera" matchea "Leche La
// Serenísima Entera 1L", pero "leche en polvo" no cae en la categoría
// exenta (mantiene el criterio conservador: ante la duda, 21%).
function matchesKeyword(haystack: string, keyword: string): boolean {
  const tokens = keyword.toLowerCase().split(' ').filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((token) => haystack.includes(token));
}

export function classifyProduct(name: string, categories: TaxCategory[]): string {
  const haystack = (name ?? '').toLowerCase();
  const sorted = [...categories].sort((a, b) => a.priority - b.priority);

  for (const category of sorted) {
    if (category.keywords.some((keyword) => matchesKeyword(haystack, keyword))) {
      return category.id;
    }
  }

  const fallback = sorted.find((category) => category.is_fallback);
  return fallback ? fallback.id : 'general';
}

// Reclasifica todos los productos no bloqueados. Se corre al final del sync
// y desde el endpoint admin (backfill + recoger mejoras de keywords).
export async function reclassifyAll(): Promise<{ classified: number }> {
  const categories = await taxCategoriesRepository.getAll();
  const products = await productRepository.getAllForClassification();

  const idsByCategory = new Map<string, string[]>();
  for (const product of products) {
    const categoryId = classifyProduct(product.name, categories);
    const ids = idsByCategory.get(categoryId) ?? [];
    ids.push(product.id);
    idsByCategory.set(categoryId, ids);
  }

  for (const [categoryId, ids] of idsByCategory) {
    await productRepository.bulkSetCategory(categoryId, ids);
  }

  return { classified: products.length };
}

// Override manual de la categoría fiscal de un producto (y la bloquea para
// que el reclasificador automático no la pise).
export async function overrideTaxCategory(
  barcode: string,
  categoryId: string,
): Promise<{ barcode: string; tax_category_id: string; tax_locked: boolean }> {
  const categories = await taxCategoriesRepository.getAll();
  if (!categories.some((c) => c.id === categoryId)) {
    throw new ApiError('Categoría fiscal inválida', 400);
  }

  const { updated } = await productRepository.updateTaxCategory(barcode, categoryId);
  if (!updated) {
    throw new ApiError('Producto no encontrado', 404);
  }

  return { barcode, tax_category_id: categoryId, tax_locked: true };
}
