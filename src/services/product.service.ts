import * as productRepository from '../repositories/product.repository';
import { calculatePricing } from './pricing.service';
import { ApiError, type ProductWithTax } from '../types/domain';

export async function getByBarcode(barcode: string): Promise<ProductWithTax> {
  if (!barcode || typeof barcode !== 'string') {
    throw new ApiError('Barcode inválido', 400);
  }

  const product = await productRepository.findByBarcode(barcode);

  if (!product) {
    throw new ApiError('Producto no encontrado', 404);
  }

  const rate = product.tax_category?.rate ?? 21;
  const pricing = calculatePricing(product.price, rate);

  return {
    ...product,
    tax: {
      category: product.tax_category?.name ?? 'General',
      rate: pricing.rate,
      net_price: pricing.net_price,
      tax_amount: pricing.tax_amount,
    },
  };
}
