const checkoutService = require('../../../src/services/checkout.service');
const cartRepository = require('../../../src/repositories/cart.repository');
const purchaseRepository = require('../../../src/repositories/purchase.repository');

jest.mock('../../../src/repositories/cart.repository');
jest.mock('../../../src/repositories/purchase.repository');
jest.mock('mercadopago', () => ({
  configure: jest.fn(),
  preferences: {
    create: jest.fn(),
  },
  payment: {
    findById: jest.fn(),
  },
}));

const mercadopago = require('mercadopago');
const { validUser, validCart, validCartItem, validProduct, validCheckoutPreference, validPurchase, validPurchaseItem } = require('../../helpers/testData');

describe('CheckoutService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('createPreference', () => {
    it('genera preferencia MP con items del carrito activo', async () => {
      const cartWithItems = {
        ...validCart,
        items: [{ ...validCartItem, unit_price: validProduct.price, product: validProduct }],
      };
      cartRepository.findActiveByUserId.mockResolvedValue(cartWithItems);
      mercadopago.preferences.create.mockResolvedValue({
        body: validCheckoutPreference,
      });

      const result = await checkoutService.createPreference(validUser.id);

      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith(validUser.id);
      expect(mercadopago.preferences.create).toHaveBeenCalled();
      expect(result).toHaveProperty('preference_id');
      expect(result).toHaveProperty('init_point');
    });

    it('lanza error si el carrito está vacío', async () => {
      cartRepository.findActiveByUserId.mockResolvedValue({ ...validCart, items: [] });

      await expect(checkoutService.createPreference(validUser.id))
        .rejects.toMatchObject({ status: 400 });
    });

    it('lanza error si no hay carrito activo', async () => {
      cartRepository.findActiveByUserId.mockResolvedValue(null);

      await expect(checkoutService.createPreference(validUser.id))
        .rejects.toMatchObject({ status: 400 });
    });
  });

  describe('processWebhook', () => {
    it('si pago aprobado, crea purchase y cierra carrito', async () => {
      mercadopago.payment.findById.mockResolvedValue({
        body: {
          id: 'MP-123456',
          status: 'approved',
          external_reference: validCart.id,
          transaction_amount: 3000,
        },
      });
      cartRepository.findById.mockResolvedValue({
        ...validCart,
        items: [{ ...validCartItem, unit_price: validProduct.price, product: validProduct }],
      });
      purchaseRepository.create.mockResolvedValue(validPurchase);
      cartRepository.updateStatus.mockResolvedValue({ ...validCart, status: 'completed' });

      const result = await checkoutService.processWebhook({ type: 'payment', data: { id: 'MP-123456' } });

      expect(purchaseRepository.create).toHaveBeenCalled();
      expect(cartRepository.updateStatus).toHaveBeenCalledWith(validCart.id, 'completed');
    });

    it('si pago rechazado, no cierra carrito', async () => {
      mercadopago.payment.findById.mockResolvedValue({
        body: {
          id: 'MP-789',
          status: 'rejected',
          external_reference: validCart.id,
        },
      });

      await checkoutService.processWebhook({ type: 'payment', data: { id: 'MP-789' } });

      expect(purchaseRepository.create).not.toHaveBeenCalled();
      expect(cartRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('ignora notificaciones de tipos no relevantes', async () => {
      await checkoutService.processWebhook({ type: 'plan', data: { id: '123' } });

      expect(mercadopago.payment.findById).not.toHaveBeenCalled();
    });
  });
});
