import * as productRepository from '../repositories/product.repository';
import type { CatalogProduct } from '../repositories/product.repository';
import { calculatePricing, DEFAULT_TAX_RATE, DEFAULT_TAX_CATEGORY_NAME } from './pricing.service';
import { ApiError, type ProductWithTax } from '../types/domain';

export const CATALOG_DEFAULT_LIMIT = 500;
export const CATALOG_MAX_LIMIT = 1000;

// Producto del catálogo con su IVA ya desglosado (misma forma que el detalle
// por barcode), para que el front lo cachee y lo muestre offline sin recalcular.
export interface CatalogItem {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  price: number;
  image_url: string | null;
  updated_at: string;
  tax: ProductWithTax['tax'];
}

export interface CatalogPage {
  products: CatalogItem[];
  count: number;
  has_more: boolean;
  // Máximo updated_at de la página: el front lo guarda como cursor del próximo sync.
  next_cursor: string | null;
}

function toCatalogItem(p: CatalogProduct): CatalogItem {
  const rate = p.tax_category?.rate ?? DEFAULT_TAX_RATE;
  const pricing = calculatePricing(p.price, rate);
  return {
    id: p.id,
    barcode: p.barcode,
    name: p.name,
    brand: p.brand,
    price: p.price,
    image_url: p.image_url,
    updated_at: p.updated_at,
    tax: {
      category: p.tax_category?.name ?? DEFAULT_TAX_CATEGORY_NAME,
      rate: pricing.rate,
      net_price: pricing.net_price,
      tax_amount: pricing.tax_amount,
    },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Catálogo incremental para el cache local del front. Sin updated_since
// devuelve todo el catálogo (primer arranque); con él, solo el delta.
export async function getCatalogSince(
  updatedSince?: string,
  limit?: number,
  offset?: number,
): Promise<CatalogPage> {
  let since = new Date(0).toISOString();
  if (updatedSince !== undefined) {
    const ts = Date.parse(updatedSince);
    if (Number.isNaN(ts)) {
      throw new ApiError('updated_since debe ser una fecha ISO válida', 400);
    }
    since = new Date(ts).toISOString();
  }

  const lim = clamp(
    Number.isFinite(limit) ? (limit as number) : CATALOG_DEFAULT_LIMIT,
    1,
    CATALOG_MAX_LIMIT,
  );
  const off = Number.isFinite(offset) && (offset as number) > 0 ? Math.floor(offset as number) : 0;

  const rows = await productRepository.findUpdatedSince(since, lim, off);
  const products = rows.map(toCatalogItem);

  return {
    products,
    count: products.length,
    has_more: products.length === lim,
    next_cursor: products.length > 0 ? products[products.length - 1].updated_at : null,
  };
}

export async function getByBarcode(barcode: string): Promise<ProductWithTax> {
  if (!barcode || typeof barcode !== 'string') {
    throw new ApiError('Barcode inválido', 400);
  }

  const product = await productRepository.findByBarcode(barcode);

  if (!product) {
    throw new ApiError('Producto no encontrado', 404);
  }

  const rate = product.tax_category?.rate ?? DEFAULT_TAX_RATE;
  const pricing = calculatePricing(product.price, rate);

  return {
    ...product,
    tax: {
      category: product.tax_category?.name ?? DEFAULT_TAX_CATEGORY_NAME,
      rate: pricing.rate,
      net_price: pricing.net_price,
      tax_amount: pricing.tax_amount,
    },
  };
}
