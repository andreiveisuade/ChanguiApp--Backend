export {};

jest.mock('../../../src/repositories/purchase.repository');

const purchaseService = require('../../../src/services/purchase.service');
const purchaseRepository = require('../../../src/repositories/purchase.repository');

const { validUser, validPurchase, validPurchaseItem } = require('../../helpers/testData');

describe('PurchaseService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('devuelve compras del usuario sin filtro de status', async () => {
      purchaseRepository.findByUserId.mockResolvedValue([validPurchase]);

      const result = await purchaseService.list(validUser.id);

      expect(purchaseRepository.findByUserId).toHaveBeenCalledWith(validUser.id, undefined);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(validPurchase.id);
    });

    it('aplica filtro de status si se pasa', async () => {
      purchaseRepository.findByUserId.mockResolvedValue([]);

      await purchaseService.list(validUser.id, 'completed');

      expect(purchaseRepository.findByUserId).toHaveBeenCalledWith(validUser.id, 'completed');
    });

    it('devuelve array vacio si no hay compras', async () => {
      purchaseRepository.findByUserId.mockResolvedValue([]);

      const result = await purchaseService.list(validUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('devuelve detalle de una compra con items del usuario', async () => {
      const purchaseWithItems = { ...validPurchase, items: [validPurchaseItem] };
      purchaseRepository.findByIdAndUser.mockResolvedValue(purchaseWithItems);

      const result = await purchaseService.getById(validUser.id, validPurchase.id);

      expect(purchaseRepository.findByIdAndUser).toHaveBeenCalledWith(
        validPurchase.id,
        validUser.id,
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].product_name).toBe('Coca Cola 500ml');
    });

    it('lanza ApiError 404 si la compra no existe o no pertenece al usuario', async () => {
      purchaseRepository.findByIdAndUser.mockResolvedValue(null);

      await expect(
        purchaseService.getById(validUser.id, 'inexistente'),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
