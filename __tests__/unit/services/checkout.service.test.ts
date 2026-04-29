export {};

jest.mock('../../../src/repositories/checkout.repository');
jest.mock('../../../src/config/mercadopago', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    preferences: { create: jest.fn() },
    payment: { findById: jest.fn() },
  },
}));

const checkoutService = require('../../../src/services/checkout.service');
const checkoutRepository = require('../../../src/repositories/checkout.repository');
const mercadopago = require('../../../src/config/mercadopago').default;

const {
  validUser,
  validCart,
  validCartItem,
  validProduct,
  validCheckoutPreference,
  validPurchase,
} = require('../../helpers/testData');

describe('CheckoutService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('createPreference', () => {
    it('genera preferencia MP con items del carrito activo', async () => {
      const cartWithItems = {
        ...validCart,
        items: [{ ...validCartItem, unit_price: validProduct.price, product: validProduct }],
      };
      checkoutRepository.findActiveCartByUserId.mockResolvedValue(cartWithItems);
      mercadopago.preferences.create.mockResolvedValue({ body: validCheckoutPreference });

      const result = await checkoutService.createPreference(validUser.id);

      expect(checkoutRepository.findActiveCartByUserId).toHaveBeenCalledWith(validUser.id);
      expect(mercadopago.preferences.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              title: validProduct.name,
              quantity: validCartItem.quantity,
              currency_id: 'ARS',
            }),
          ]),
          external_reference: validCart.id,
        }),
      );
      expect(result.preference_id).toBe(validCheckoutPreference.preference_id);
      expect(result.init_point).toBe(validCheckoutPreference.init_point);
    });

    it('lanza ApiError 400 si el carrito esta vacio', async () => {
      checkoutRepository.findActiveCartByUserId.mockResolvedValue({ ...validCart, items: [] });

      await expect(checkoutService.createPreference(validUser.id)).rejects.toMatchObject({
        status: 400,
      });

      expect(mercadopago.preferences.create).not.toHaveBeenCalled();
    });

    it('lanza ApiError 400 si no hay carrito activo', async () => {
      checkoutRepository.findActiveCartByUserId.mockResolvedValue(null);

      await expect(checkoutService.createPreference(validUser.id)).rejects.toMatchObject({
        status: 400,
      });
    });
  });

  describe('handleWebhook', () => {
    it('si pago aprobado, crea purchase + inserta items + cierra carrito', async () => {
      const cartWithItems = {
        ...validCart,
        items: [{ ...validCartItem, unit_price: validProduct.price, product: validProduct }],
      };
      mercadopago.payment.findById.mockResolvedValue({
        body: {
          id: 'MP-123456',
          status: 'approved',
          external_reference: validCart.id,
        },
      });
      checkoutRepository.findCartById.mockResolvedValue(cartWithItems);
      checkoutRepository.createPurchase.mockResolvedValue(validPurchase);
      checkoutRepository.insertPurchaseItems.mockResolvedValue(undefined);
      checkoutRepository.closeCart.mockResolvedValue(undefined);

      await checkoutService.handleWebhook({ type: 'payment', data: { id: 'MP-123456' } });

      expect(checkoutRepository.createPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: validCart.user_id,
          payment_id: 'MP-123456',
          payment_status: 'completed',
        }),
      );
      expect(checkoutRepository.insertPurchaseItems).toHaveBeenCalledWith(
        validPurchase.id,
        cartWithItems.items,
      );
      expect(checkoutRepository.closeCart).toHaveBeenCalledWith(validCart.id);
    });

    it('si pago rechazado, no crea purchase ni cierra carrito', async () => {
      mercadopago.payment.findById.mockResolvedValue({
        body: {
          id: 'MP-789',
          status: 'rejected',
          external_reference: validCart.id,
        },
      });
      checkoutRepository.findCartById.mockResolvedValue({
        ...validCart,
        items: [validCartItem],
      });

      await checkoutService.handleWebhook({ type: 'payment', data: { id: 'MP-789' } });

      expect(checkoutRepository.createPurchase).not.toHaveBeenCalled();
      expect(checkoutRepository.closeCart).not.toHaveBeenCalled();
    });

    it('ignora notificaciones que no son de tipo payment', async () => {
      await checkoutService.handleWebhook({ type: 'plan', data: { id: '123' } });

      expect(mercadopago.payment.findById).not.toHaveBeenCalled();
    });

    it('ignora notificaciones sin data.id', async () => {
      await checkoutService.handleWebhook({ type: 'payment', data: {} });

      expect(mercadopago.payment.findById).not.toHaveBeenCalled();
    });

    it('si el carrito de external_reference no existe, no hace nada', async () => {
      mercadopago.payment.findById.mockResolvedValue({
        body: {
          id: 'MP-999',
          status: 'approved',
          external_reference: 'cart-inexistente',
        },
      });
      checkoutRepository.findCartById.mockResolvedValue(null);

      await checkoutService.handleWebhook({ type: 'payment', data: { id: 'MP-999' } });

      expect(checkoutRepository.createPurchase).not.toHaveBeenCalled();
    });

    it('status pending no crea purchase ni cierra carrito', async () => {
      mercadopago.payment.findById.mockResolvedValue({
        body: {
          id: 'MP-PEND',
          status: 'pending',
          external_reference: validCart.id,
        },
      });
      checkoutRepository.findCartById.mockResolvedValue({
        ...validCart,
        items: [validCartItem],
      });

      await checkoutService.handleWebhook({ type: 'payment', data: { id: 'MP-PEND' } });

      expect(checkoutRepository.createPurchase).not.toHaveBeenCalled();
      expect(checkoutRepository.closeCart).not.toHaveBeenCalled();
    });

    it('payment.findById devuelve sin body, no hace nada', async () => {
      mercadopago.payment.findById.mockResolvedValue({ body: null });

      await checkoutService.handleWebhook({ type: 'payment', data: { id: 'MP-X' } });

      expect(checkoutRepository.findCartById).not.toHaveBeenCalled();
    });

    it('payment sin external_reference, no hace nada', async () => {
      mercadopago.payment.findById.mockResolvedValue({
        body: { id: 'MP-NO-REF', status: 'approved' },
      });

      await checkoutService.handleWebhook({ type: 'payment', data: { id: 'MP-NO-REF' } });

      expect(checkoutRepository.findCartById).not.toHaveBeenCalled();
    });

    it('total se calcula correctamente con multiples items', async () => {
      const items = [
        { ...validCartItem, quantity: 2, unit_price: 100, product: validProduct },
        { ...validCartItem, id: 'item-2', quantity: 3, unit_price: 50, product: validProduct },
        { ...validCartItem, id: 'item-3', quantity: 1, unit_price: 150, product: validProduct },
      ];
      mercadopago.payment.findById.mockResolvedValue({
        body: {
          id: 'MP-MULTI',
          status: 'approved',
          external_reference: validCart.id,
        },
      });
      checkoutRepository.findCartById.mockResolvedValue({ ...validCart, items });
      checkoutRepository.createPurchase.mockResolvedValue(validPurchase);
      checkoutRepository.insertPurchaseItems.mockResolvedValue(undefined);
      checkoutRepository.closeCart.mockResolvedValue(undefined);

      await checkoutService.handleWebhook({ type: 'payment', data: { id: 'MP-MULTI' } });

      // 2*100 + 3*50 + 1*150 = 500
      expect(checkoutRepository.createPurchase).toHaveBeenCalledWith(
        expect.objectContaining({ total: 500 }),
      );
    });

    it('item sin product usa "Producto" como fallback en MP items', async () => {
      const cartWithItemSinProduct = {
        ...validCart,
        items: [{ ...validCartItem, product: undefined }],
      };
      checkoutRepository.findActiveCartByUserId.mockResolvedValue(cartWithItemSinProduct);
      mercadopago.preferences.create.mockResolvedValue({ body: validCheckoutPreference });

      await checkoutService.createPreference(validUser.id);

      expect(mercadopago.preferences.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([expect.objectContaining({ title: 'Producto' })]),
        }),
      );
    });
  });
});
