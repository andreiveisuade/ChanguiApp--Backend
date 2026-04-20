const purchaseService = require('../../../src/services/purchase.service');
const purchaseRepository = require('../../../src/repositories/purchase.repository');

jest.mock('../../../src/repositories/purchase.repository');

const { validUser, validPurchase, validPurchaseItem } = require('../../helpers/testData');

describe('PurchaseService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('devuelve compras del usuario ordenadas por fecha desc', async () => {
      purchaseRepository.findByUserId.mockResolvedValue([validPurchase]);

      const result = await purchaseService.list(validUser.id);

      expect(purchaseRepository.findByUserId).toHaveBeenCalledWith(validUser.id);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(validPurchase.id);
    });

    it('devuelve array vacío si no hay compras', async () => {
      purchaseRepository.findByUserId.mockResolvedValue([]);

      const result = await purchaseService.list(validUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('devuelve detalle de una compra con items', async () => {
      const purchaseWithItems = { ...validPurchase, items: [validPurchaseItem] };
      purchaseRepository.findByIdWithItems.mockResolvedValue(purchaseWithItems);

      const result = await purchaseService.getById(validPurchase.id, validUser.id);

      expect(purchaseRepository.findByIdWithItems).toHaveBeenCalledWith(validPurchase.id);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].product_name).toBe('Coca Cola 500ml');
    });

    it('lanza error 404 si la compra no existe', async () => {
      purchaseRepository.findByIdWithItems.mockResolvedValue(null);

      await expect(purchaseService.getById('inexistente', validUser.id))
        .rejects.toMatchObject({ status: 404 });
    });

    it('lanza error 403 si la compra es de otro usuario', async () => {
      purchaseRepository.findByIdWithItems.mockResolvedValue({
        ...validPurchase,
        user_id: 'otro-usuario',
        items: [validPurchaseItem],
      });

      await expect(purchaseService.getById(validPurchase.id, validUser.id))
        .rejects.toMatchObject({ status: 403 });
    });
  });
});
