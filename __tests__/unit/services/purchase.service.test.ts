import { PurchaseService } from '../../../src/services/purchase.service';

const { validUser, validPurchase, validPurchaseItem } = require('../../helpers/testData');

// DIP en acción: inyectamos un repo fake, sin mockear el módulo de Supabase.
describe('PurchaseService', () => {
  let repo: { findByUserId: jest.Mock; findByIdAndUser: jest.Mock };
  let service: PurchaseService;

  beforeEach(() => {
    repo = { findByUserId: jest.fn(), findByIdAndUser: jest.fn() };
    service = new PurchaseService(repo);
  });

  describe('list', () => {
    it('devuelve compras del usuario sin filtro de status', async () => {
      repo.findByUserId.mockResolvedValue([validPurchase]);

      const result = await service.list(validUser.id);

      expect(repo.findByUserId).toHaveBeenCalledWith(validUser.id, undefined);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(validPurchase.id);
    });

    it('aplica filtro de status si se pasa', async () => {
      repo.findByUserId.mockResolvedValue([]);

      await service.list(validUser.id, 'completed');

      expect(repo.findByUserId).toHaveBeenCalledWith(validUser.id, 'completed');
    });

    it('devuelve array vacio si no hay compras', async () => {
      repo.findByUserId.mockResolvedValue([]);

      const result = await service.list(validUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('devuelve detalle de una compra con items del usuario', async () => {
      const purchaseWithItems = { ...validPurchase, items: [validPurchaseItem] };
      repo.findByIdAndUser.mockResolvedValue(purchaseWithItems);

      const result = await service.getById(validUser.id, validPurchase.id);

      expect(repo.findByIdAndUser).toHaveBeenCalledWith(validPurchase.id, validUser.id);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].product_name).toBe('Coca Cola 500ml');
    });

    it('lanza ApiError 404 si la compra no existe o no pertenece al usuario', async () => {
      repo.findByIdAndUser.mockResolvedValue(null);

      await expect(
        service.getById(validUser.id, 'inexistente'),
      ).rejects.toMatchObject({ status: 404 });
    });

    it('lanza ApiError 404 si purchase pertenece a otro user (filtro por user_id en repo)', async () => {
      // El repo filtra por (id, user_id). Si el purchase es de otro user, devuelve null.
      repo.findByIdAndUser.mockResolvedValue(null);

      await expect(
        service.getById(validUser.id, validPurchase.id),
      ).rejects.toMatchObject({ status: 404 });

      expect(repo.findByIdAndUser).toHaveBeenCalledWith(validPurchase.id, validUser.id);
    });

    it('propaga errores de DB del repository', async () => {
      repo.findByIdAndUser.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        service.getById(validUser.id, validPurchase.id),
      ).rejects.toThrow('DB connection lost');
    });
  });
});
