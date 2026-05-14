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
      expect(result).toEqual(validProduct);
      expect(result.price).toBe(1500);
    });

    it('lanza error 404 si el barcode no está en el catálogo', async () => {
      productRepository.findByBarcode.mockResolvedValue(null);

      await expect(productService.getByBarcode('0000000000000'))
        .rejects.toMatchObject({ status: 404 });
    });

    it('lanza error si barcode vacío o inválido', async () => {
      await expect(productService.getByBarcode(null))
        .rejects.toThrow();

      await expect(productService.getByBarcode(''))
        .rejects.toThrow();
    });
  });
});
