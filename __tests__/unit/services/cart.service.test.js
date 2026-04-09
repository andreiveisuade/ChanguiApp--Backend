const cartService = require('../../../src/services/cart.service');
const cartRepository = require('../../../src/repositories/cart.repository');

jest.mock('../../../src/repositories/cart.repository');

const { validCart, validCartItem, validProduct, validUser } = require('../../helpers/testData');

describe('CartService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getCart', () => {
    it('devuelve el carrito activo del usuario con items y totales', async () => {
      const cartWithItems = {
        ...validCart,
        items: [{ ...validCartItem, unit_price: validProduct.price }],
      };
      cartRepository.findActiveByUserId.mockResolvedValue(cartWithItems);

      const result = await cartService.getCart(validUser.id);

      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith(validUser.id);
      expect(result).toEqual(cartWithItems);
    });

    it('lanza error si no hay carrito activo', async () => {
      cartRepository.findActiveByUserId.mockResolvedValue(null);

      await expect(cartService.getCart('user-inexistente'))
        .rejects.toThrow('No hay carrito activo');
    });
  });

  describe('addItem', () => {
    it('agrega producto al carrito activo y devuelve item creado', async () => {
      cartRepository.findActiveByUserId.mockResolvedValue(validCart);
      const newItem = { ...validCartItem, id: 'new-item-uuid' };
      cartRepository.addItem.mockResolvedValue(newItem);

      const result = await cartService.addItem(validUser.id, validProduct.id, 2);

      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith(validUser.id);
      expect(cartRepository.addItem).toHaveBeenCalledWith(validCart.id, validProduct.id, 2);
      expect(result).toEqual(newItem);
    });

    it('si no hay carrito activo, crea uno nuevo y agrega el item', async () => {
      cartRepository.findActiveByUserId.mockResolvedValue(null);
      const newCart = { ...validCart, id: 'new-cart-uuid' };
      cartRepository.create.mockResolvedValue(newCart);
      const newItem = { ...validCartItem, cart_id: newCart.id };
      cartRepository.addItem.mockResolvedValue(newItem);

      const result = await cartService.addItem(validUser.id, validProduct.id, 2);

      expect(cartRepository.create).toHaveBeenCalledWith(validUser.id);
      expect(cartRepository.addItem).toHaveBeenCalledWith(newCart.id, validProduct.id, 2);
      expect(result).toEqual(newItem);
    });
  });

  describe('updateItem', () => {
    it('actualiza cantidad y recalcula subtotal', async () => {
      const updatedItem = { ...validCartItem, quantity: 5 };
      cartRepository.updateItemQuantity.mockResolvedValue(updatedItem);

      const result = await cartService.updateItem(validCartItem.id, 5);

      expect(cartRepository.updateItemQuantity).toHaveBeenCalledWith(validCartItem.id, 5);
      expect(result).toEqual(updatedItem);
    });

    it('lanza error si el item no existe', async () => {
      cartRepository.updateItemQuantity.mockResolvedValue(null);

      await expect(cartService.updateItem('item-inexistente', 3))
        .rejects.toThrow('Item no encontrado');
    });
  });

  describe('removeItem', () => {
    it('elimina item del carrito', async () => {
      cartRepository.deleteItem.mockResolvedValue(true);

      const result = await cartService.removeItem(validCartItem.id);

      expect(cartRepository.deleteItem).toHaveBeenCalledWith(validCartItem.id);
      expect(result).toBe(true);
    });
  });

  describe('clearCart', () => {
    it('vacia el carrito completo y cambia status a cancelled', async () => {
      cartRepository.findActiveByUserId.mockResolvedValue(validCart);
      cartRepository.clearCart.mockResolvedValue({ ...validCart, status: 'cancelled' });

      const result = await cartService.clearCart(validUser.id);

      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith(validUser.id);
      expect(cartRepository.clearCart).toHaveBeenCalledWith(validCart.id);
      expect(result.status).toBe('cancelled');
    });
  });
});
