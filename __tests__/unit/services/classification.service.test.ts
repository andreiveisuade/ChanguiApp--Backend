import * as productRepository from '../../../src/repositories/product.repository';
import * as taxCategoriesRepository from '../../../src/repositories/tax_categories.repository';
import { classifyProduct, reclassifyAll } from '../../../src/services/classification.service';
import { validTaxCategories } from '../../helpers/testData';

jest.mock('../../../src/repositories/product.repository');
jest.mock('../../../src/repositories/tax_categories.repository');

const mockProductRepo = jest.mocked(productRepository);
const mockTaxRepo = jest.mocked(taxCategoriesRepository);

describe('classification.service', () => {
  afterEach(() => jest.clearAllMocks());

  describe('classifyProduct', () => {
    it('clasifica por keyword de una palabra', () => {
      expect(classifyProduct('Carne Picada Especial 1kg', validTaxCategories)).toBe('carnes');
    });

    it('match por tokens: keyword multi-palabra con la marca en el medio', () => {
      expect(classifyProduct('Leche La Serenísima Entera 1L', validTaxCategories)).toBe('leche');
    });

    it('leche en polvo NO cae en exento (criterio conservador → general)', () => {
      expect(classifyProduct('Leche en Polvo Nido 400g', validTaxCategories)).toBe('general');
    });

    it('es case-insensitive', () => {
      expect(classifyProduct('POLLO ENTERO FRESCO', validTaxCategories)).toBe('carnes');
    });

    it('sin coincidencia cae en el fallback', () => {
      expect(classifyProduct('Lavandina Ayudín 1L', validTaxCategories)).toBe('general');
    });

    it('respeta priority (la categoría más específica gana)', () => {
      expect(classifyProduct('Leche Descremada 1L', validTaxCategories)).toBe('leche');
    });

    it('nombre vacío cae en el fallback', () => {
      expect(classifyProduct('', validTaxCategories)).toBe('general');
    });
  });

  describe('reclassifyAll', () => {
    it('clasifica los productos no bloqueados y actualiza por categoría', async () => {
      mockTaxRepo.getAll.mockResolvedValue(validTaxCategories as never);
      mockProductRepo.getAllForClassification.mockResolvedValue([
        { id: 'p1', name: 'Carne Picada 1kg' },
        { id: 'p2', name: 'Leche Entera 1L' },
        { id: 'p3', name: 'Lavandina 1L' },
      ]);
      mockProductRepo.bulkSetCategory.mockResolvedValue(undefined);

      const result = await reclassifyAll();

      expect(result.classified).toBe(3);
      expect(mockProductRepo.bulkSetCategory).toHaveBeenCalledWith('carnes', ['p1']);
      expect(mockProductRepo.bulkSetCategory).toHaveBeenCalledWith('leche', ['p2']);
      expect(mockProductRepo.bulkSetCategory).toHaveBeenCalledWith('general', ['p3']);
    });

    it('sin productos no llama a bulkSetCategory', async () => {
      mockTaxRepo.getAll.mockResolvedValue(validTaxCategories as never);
      mockProductRepo.getAllForClassification.mockResolvedValue([]);

      const result = await reclassifyAll();

      expect(result.classified).toBe(0);
      expect(mockProductRepo.bulkSetCategory).not.toHaveBeenCalled();
    });
  });
});
