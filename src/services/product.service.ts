import * as productRepository from '../repositories/product.repository';
import { ApiError, Product } from '../types/domain';

export async function getByBarcode(barcode: string): Promise<Product> {
  if (!barcode || typeof barcode !== 'string') {
    throw new ApiError('Barcode inválido', 400);
  }

  const product = await productRepository.findByBarcode(barcode);

  if (!product) {
    throw new ApiError('Producto no encontrado', 404);
  }

  return product;
}
