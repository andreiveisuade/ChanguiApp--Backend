import { asyncHandler } from '../utils/asyncHandler';
import * as productService from '../services/product.service';

export const getByBarcode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const product = await productService.getByBarcode(String(code));
  res.json(product);
});

export const getCatalog = asyncHandler(async (req, res) => {
  const { updated_since, limit, offset } = req.query;
  const page = await productService.getCatalogSince(
    updated_since !== undefined ? String(updated_since) : undefined,
    limit !== undefined ? Number(limit) : undefined,
    offset !== undefined ? Number(offset) : undefined,
  );
  res.json(page);
});
