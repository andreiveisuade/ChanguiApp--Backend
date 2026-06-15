export {};

const productService = require('../../../src/services/product.service');
const productRepository = require('../../../src/repositories/product.repository');

jest.mock('../../../src/repositories/product.repository');

const { validProduct } = require('../../helpers/testData');

describe('ProductService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getByBarcode', () => {
    it('devuelve producto del catálogo local por barcode', async () => {
      productRepository.findByBarcode.mockResolvedValue(validProduct);

      const result = await productService.getByBarcode(validProduct.barcode);

      expect(productRepository.findByBarcode).toHaveBeenCalledWith(validProduct.barcode);
      expect(result).toMatchObject(validProduct);
      expect(result.price).toBe(1500);
      expect(result.tax).toEqual({
        category: 'General',
        rate: 21,
        net_price: 1239.67,
        tax_amount: 260.33,
      });
    });

    it('producto sin tax_category cae al 21% (General) por defecto', async () => {
      productRepository.findByBarcode.mockResolvedValue({ ...validProduct, tax_category: null });

      const result = await productService.getByBarcode(validProduct.barcode);

      expect(result.tax).toEqual({
        category: 'General',
        rate: 21,
        net_price: 1239.67,
        tax_amount: 260.33,
      });
    });

    it('lanza error 404 si el barcode no está en el catálogo', async () => {
      productRepository.findByBarcode.mockResolvedValue(null);

      await expect(productService.getByBarcode('0000000000000')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('lanza error si barcode vacío o inválido', async () => {
      await expect(productService.getByBarcode(null)).rejects.toThrow();

      await expect(productService.getByBarcode('')).rejects.toThrow();
    });
  });

  describe('getCatalogSince', () => {
    const row = {
      id: 'p1',
      barcode: '111',
      name: 'A',
      brand: 'X',
      price: 121,
      image_url: null,
      updated_at: '2026-06-08T10:00:00.000Z',
      tax_category: { name: 'General', rate: 21 },
    };

    it('sin updated_since baja todo desde epoch, calcula el IVA y arma next_cursor', async () => {
      productRepository.findUpdatedSince.mockResolvedValue([row]);

      const result = await productService.getCatalogSince();

      expect(productRepository.findUpdatedSince).toHaveBeenCalledWith(
        new Date(0).toISOString(),
        productService.CATALOG_DEFAULT_LIMIT,
        0,
      );
      expect(result.count).toBe(1);
      expect(result.has_more).toBe(false);
      expect(result.next_cursor).toBe('2026-06-08T10:00:00.000Z');
      expect(result.products[0]).toEqual({
        id: 'p1',
        barcode: '111',
        name: 'A',
        brand: 'X',
        price: 121,
        image_url: null,
        updated_at: '2026-06-08T10:00:00.000Z',
        tax: { category: 'General', rate: 21, net_price: 100, tax_amount: 21 },
      });
    });

    it('producto sin categoría fiscal cae al 21% (General)', async () => {
      productRepository.findUpdatedSince.mockResolvedValue([{ ...row, tax_category: null }]);

      const result = await productService.getCatalogSince();

      expect(result.products[0].tax).toEqual({
        category: 'General',
        rate: 21,
        net_price: 100,
        tax_amount: 21,
      });
    });

    it('pasa el cursor normalizado a ISO y respeta limit/offset', async () => {
      productRepository.findUpdatedSince.mockResolvedValue([]);

      const result = await productService.getCatalogSince('2026-06-01T00:00:00Z', 50, 100);

      expect(productRepository.findUpdatedSince).toHaveBeenCalledWith(
        '2026-06-01T00:00:00.000Z',
        50,
        100,
      );
      expect(result).toEqual({ products: [], count: 0, has_more: false, next_cursor: null });
    });

    it('has_more=true cuando la página llena el limit', async () => {
      productRepository.findUpdatedSince.mockResolvedValue([row, row]);
      const result = await productService.getCatalogSince(undefined, 2, 0);
      expect(result.has_more).toBe(true);
    });

    it('clampa limit al máximo y normaliza offset negativo a 0', async () => {
      productRepository.findUpdatedSince.mockResolvedValue([]);

      await productService.getCatalogSince(undefined, 99999, -5);

      expect(productRepository.findUpdatedSince).toHaveBeenCalledWith(
        new Date(0).toISOString(),
        productService.CATALOG_MAX_LIMIT,
        0,
      );
    });

    it('lanza 400 si updated_since no es fecha válida', async () => {
      await expect(productService.getCatalogSince('no-es-fecha')).rejects.toMatchObject({
        status: 400,
      });
      expect(productRepository.findUpdatedSince).not.toHaveBeenCalled();
    });
  });
});
