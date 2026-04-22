import * as cartRepository from '../../../src/repositories/cart.repository';
import * as cartService from '../../../src/services/cart.service';
import { validCart, validCartItem, validProduct, validUser } from '../../helpers/testData';

jest.mock('../../../src/repositories/cart.repository');

const mockRepo = jest.mocked(cartRepository);

describe('CartService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getCart', () => {
    it('devuelve cart, items y total del carrito activo', async () => {
      const cartWithItems = {
        ...validCart,
        items: [{ ...validCartItem, unit_price: validProduct.price }],
      };
      mockRepo.findActiveCartByUserId.mockResolvedValue(cartWithItems as any);

      const result = await cartService.getCart(validUser.id);

      expect(mockRepo.findActiveCartByUserId).toHaveBeenCalledWith(validUser.id);
      expect(result.cart).toEqual(cartWithItems);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(validProduct.price * validCartItem.quantity);
    });

    it('devuelve cart null, items vacío y total 0 si no hay carrito', async () => {
      mockRepo.findActiveCartByUserId.mockResolvedValue(null);

      const result = await cartService.getCart(validUser.id);

      expect(result.cart).toBeNull();
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('addItem', () => {
    it('agrega producto al carrito activo', async () => {
      mockRepo.findActiveCartByUserId.mockResolvedValue(validCart as any);
      mockRepo.addOrUpdateItem.mockResolvedValue(validCartItem as any);

      const result = await cartService.addItem(
        validUser.id,
        validCart.store_id,
        validProduct.id,
        2,
        validProduct.price
      );

      expect(mockRepo.addOrUpdateItem).toHaveBeenCalledWith(
        validCart.id,
        validProduct.id,
        2,
        validProduct.price
      );
      expect(result).toEqual(validCartItem);
    });

    it('crea carrito si no existe y agrega el item', async () => {
      mockRepo.findActiveCartByUserId.mockResolvedValue(null);
      const newCart = { ...validCart, id: 'new-cart-uuid' };
      mockRepo.createCart.mockResolvedValue(newCart as any);
      mockRepo.addOrUpdateItem.mockResolvedValue(validCartItem as any);

      await cartService.addItem(validUser.id, validCart.store_id, validProduct.id, 2, validProduct.price);

      expect(mockRepo.createCart).toHaveBeenCalledWith(validUser.id, validCart.store_id);
      expect(mockRepo.addOrUpdateItem).toHaveBeenCalledWith(
        newCart.id,
        validProduct.id,
        2,
        validProduct.price
      );
    });

    it('lanza ApiError 400 si no hay carrito y falta storeId', async () => {
      mockRepo.findActiveCartByUserId.mockResolvedValue(null);

      await expect(
        cartService.addItem(validUser.id, undefined, validProduct.id, 2, validProduct.price)
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('updateItem', () => {
    it('actualiza la cantidad del item', async () => {
      const updated = { ...validCartItem, quantity: 5 };
      mockRepo.findItemById.mockResolvedValue(validCartItem as any);
      mockRepo.findActiveCartByUserId.mockResolvedValue(validCart as any);
      mockRepo.updateItemQuantity.mockResolvedValue(updated as any);

      const result = await cartService.updateItem(validUser.id, validCartItem.id, 5);

      expect(mockRepo.updateItemQuantity).toHaveBeenCalledWith(validCartItem.id, 5);
      expect(result).toEqual(updated);
    });

    it('elimina el item si quantity <= 0', async () => {
      mockRepo.findItemById.mockResolvedValue(validCartItem as any);
      mockRepo.findActiveCartByUserId.mockResolvedValue(validCart as any);
      mockRepo.removeItem.mockResolvedValue(validCartItem as any);

      const result = await cartService.updateItem(validUser.id, validCartItem.id, 0);

      expect(mockRepo.removeItem).toHaveBeenCalledWith(validCartItem.id);
      expect(result).toBeNull();
    });

    it('lanza ApiError 404 si el item no existe', async () => {
      mockRepo.findItemById.mockResolvedValue(null);

      await expect(cartService.updateItem(validUser.id, 'inexistente', 3)).rejects.toMatchObject({
        status: 404,
      });
    });

    it('lanza ApiError 403 si el item no pertenece al carrito del usuario', async () => {
      mockRepo.findItemById.mockResolvedValue({ ...validCartItem, cart_id: 'otro-cart' } as any);
      mockRepo.findActiveCartByUserId.mockResolvedValue(validCart as any);

      await expect(
        cartService.updateItem(validUser.id, validCartItem.id, 3)
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('removeItem', () => {
    it('elimina item del carrito', async () => {
      mockRepo.findItemById.mockResolvedValue(validCartItem as any);
      mockRepo.findActiveCartByUserId.mockResolvedValue(validCart as any);
      mockRepo.removeItem.mockResolvedValue(validCartItem as any);

      const result = await cartService.removeItem(validUser.id, validCartItem.id);

      expect(mockRepo.removeItem).toHaveBeenCalledWith(validCartItem.id);
      expect(result).toEqual(validCartItem);
    });

    it('lanza ApiError 404 si el item no existe', async () => {
      mockRepo.findItemById.mockResolvedValue(null);

      await expect(cartService.removeItem(validUser.id, 'inexistente')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('lanza ApiError 403 si el item no pertenece al carrito del usuario', async () => {
      mockRepo.findItemById.mockResolvedValue({ ...validCartItem, cart_id: 'otro-cart' } as any);
      mockRepo.findActiveCartByUserId.mockResolvedValue(validCart as any);

      await expect(
        cartService.removeItem(validUser.id, validCartItem.id)
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('cancelCart', () => {
    it('cancela el carrito activo del usuario', async () => {
      const cancelled = { ...validCart, status: 'cancelled' };
      mockRepo.findActiveCartByUserId.mockResolvedValue(validCart as any);
      mockRepo.cancelCart.mockResolvedValue(cancelled as any);

      const result = await cartService.cancelCart(validUser.id);

      expect(mockRepo.cancelCart).toHaveBeenCalledWith(validCart.id);
      expect(result).toEqual(cancelled);
    });

    it('lanza ApiError 404 si no hay carrito activo', async () => {
      mockRepo.findActiveCartByUserId.mockResolvedValue(null);

      await expect(cartService.cancelCart(validUser.id)).rejects.toMatchObject({ status: 404 });
    });
  });
});
