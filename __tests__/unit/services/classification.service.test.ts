import * as productRepository from '../../../src/repositories/product.repository';
import * as taxCategoriesRepository from '../../../src/repositories/tax_categories.repository';
import {
  classifyProduct,
  reclassifyAll,
  overrideTaxCategory,
} from '../../../src/services/classification.service';
import { validTaxCategories } from '../../helpers/testData';

jest.mock('../../../src/repositories/product.repository');
jest.mock('../../../src/repositories/tax_categories.repository');

const mockProductRepo = jest.mocked(productRepository);
const mockTaxRepo = jest.mocked(taxCategoriesRepository);

describe('classification.service', () => {
  afterEach(() => jest.clearAllMocks());

  describe('classifyProduct', () => {
    // match por keyword de una palabra, match por tokens (marca en el medio),
    // criterio conservador (leche en polvo → general), case-insensitive,
    // fallback sin match, prioridad y nombre vacío.
    it.each([
      ['Carne Picada Especial 1kg', 'carnes'],
      ['Leche La Serenísima Entera 1L', 'leche'],
      ['Leche en Polvo Nido 400g', 'general'],
      ['POLLO ENTERO FRESCO', 'carnes'],
      ['Lavandina Ayudín 1L', 'general'],
      ['Leche Descremada 1L', 'leche'],
      ['', 'general'],
    ])('clasifica "%s" → %s', (name, expected) => {
      expect(classifyProduct(name, validTaxCategories)).toBe(expected);
    });
  });

  describe('reclassifyAll', () => {
    beforeEach(() => {
      mockTaxRepo.getAll.mockResolvedValue(validTaxCategories as never);
      mockProductRepo.bulkSetCategory.mockResolvedValue(undefined);
    });

    it('clasifica los productos no bloqueados y actualiza por categoría', async () => {
      mockProductRepo.getAllForClassification.mockResolvedValue([
        { id: 'p1', name: 'Carne Picada 1kg' },
        { id: 'p2', name: 'Leche Entera 1L' },
        { id: 'p3', name: 'Lavandina 1L' },
      ]);

      const result = await reclassifyAll();

      expect(result.classified).toBe(3);
      expect(mockProductRepo.bulkSetCategory).toHaveBeenCalledWith('carnes', ['p1']);
      expect(mockProductRepo.bulkSetCategory).toHaveBeenCalledWith('leche', ['p2']);
      expect(mockProductRepo.bulkSetCategory).toHaveBeenCalledWith('general', ['p3']);
    });

    it('sin productos no llama a bulkSetCategory', async () => {
      mockProductRepo.getAllForClassification.mockResolvedValue([]);

      const result = await reclassifyAll();

      expect(result.classified).toBe(0);
      expect(mockProductRepo.bulkSetCategory).not.toHaveBeenCalled();
    });
  });

  describe('overrideTaxCategory', () => {
    it('lanza 400 si la categoría no existe y no toca el producto', async () => {
      mockTaxRepo.getAll.mockResolvedValue([{ id: 'carnes' }] as never);

      await expect(overrideTaxCategory('7790', 'inexistente')).rejects.toMatchObject({
        status: 400,
      });
      expect(mockProductRepo.updateTaxCategory).not.toHaveBeenCalled();
    });

    it('lanza 404 si el producto no existe (updated=false)', async () => {
      mockTaxRepo.getAll.mockResolvedValue([{ id: 'carnes' }] as never);
      mockProductRepo.updateTaxCategory.mockResolvedValue({ updated: false } as never);

      await expect(overrideTaxCategory('000', 'carnes')).rejects.toMatchObject({ status: 404 });
    });

    it('override exitoso valida la categoría, actualiza y devuelve el producto bloqueado', async () => {
      mockTaxRepo.getAll.mockResolvedValue([{ id: 'carnes' }] as never);
      mockProductRepo.updateTaxCategory.mockResolvedValue({ updated: true } as never);

      const result = await overrideTaxCategory('7790', 'carnes');

      expect(result).toEqual({ barcode: '7790', tax_category_id: 'carnes', tax_locked: true });
      expect(mockProductRepo.updateTaxCategory).toHaveBeenCalledWith('7790', 'carnes');
    });
  });
});
