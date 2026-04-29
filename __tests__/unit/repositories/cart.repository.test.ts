jest.mock('../../../src/config/supabase', () => require('../../helpers/mockSupabase'));

import mockSupabase from '../../helpers/mockSupabase';
import * as cartRepository from '../../../src/repositories/cart.repository';
import { validCart, validCartItem, validProduct } from '../../helpers/testData';

describe('CartRepository', () => {
  afterEach(() => jest.clearAllMocks());

  describe('findActiveCartByUserId', () => {
    it('devuelve carrito activo con items para el usuario', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: validCart, error: null });

      const result = await cartRepository.findActiveCartByUserId(validCart.user_id);

      expect(mockSupabase.from).toHaveBeenCalledWith('carts');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', validCart.user_id);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'active');
      expect(result).toEqual(validCart);
    });

    it('retorna null si no hay carrito activo', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await cartRepository.findActiveCartByUserId('no-user');

      expect(result).toBeNull();
    });
  });

  describe('createCart', () => {
    it('crea un carrito nuevo con status active', async () => {
      mockSupabase.single.mockResolvedValue({ data: validCart, error: null });

      const result = await cartRepository.createCart(validCart.user_id, validCart.store_id);

      expect(mockSupabase.from).toHaveBeenCalledWith('carts');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: validCart.user_id,
        store_id: validCart.store_id,
        status: 'active',
      });
      expect(result).toEqual(validCart);
    });
  });

  describe('addOrUpdateItem', () => {
    it('hace upsert de item en cart_items', async () => {
      mockSupabase.single.mockResolvedValue({ data: validCartItem, error: null });

      const result = await cartRepository.addOrUpdateItem(
        validCart.id,
        validProduct.id,
        validCartItem.quantity,
        validCartItem.unit_price
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        {
          cart_id: validCart.id,
          product_id: validProduct.id,
          quantity: validCartItem.quantity,
          unit_price: validCartItem.unit_price,
        },
        { onConflict: 'cart_id,product_id', ignoreDuplicates: false }
      );
      expect(result).toEqual(validCartItem);
    });
  });

  describe('findItemById', () => {
    it('retorna item por id', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: validCartItem, error: null });

      const result = await cartRepository.findItemById(validCartItem.id);

      expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', validCartItem.id);
      expect(result).toEqual(validCartItem);
    });

    it('retorna null si el item no existe', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await cartRepository.findItemById('no-item');

      expect(result).toBeNull();
    });
  });

  describe('updateItemQuantity', () => {
    it('actualiza quantity por item id', async () => {
      const updated = { ...validCartItem, quantity: 5 };
      mockSupabase.single.mockResolvedValue({ data: updated, error: null });

      const result = await cartRepository.updateItemQuantity(validCartItem.id, 5);

      expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
      expect(mockSupabase.update).toHaveBeenCalledWith({ quantity: 5 });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', validCartItem.id);
      expect(result).toEqual(updated);
    });
  });

  describe('removeItem', () => {
    it('elimina item y lo retorna', async () => {
      mockSupabase.single.mockResolvedValue({ data: validCartItem, error: null });

      const result = await cartRepository.removeItem(validCartItem.id);

      expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', validCartItem.id);
      expect(result).toEqual(validCartItem);
    });
  });

  describe('cancelCart', () => {
    it('cambia status del carrito a cancelled', async () => {
      const cancelled = { ...validCart, status: 'cancelled' };
      mockSupabase.single.mockResolvedValue({ data: cancelled, error: null });

      const result = await cartRepository.cancelCart(validCart.id);

      expect(mockSupabase.from).toHaveBeenCalledWith('carts');
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'cancelled' });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', validCart.id);
      expect(result).toEqual(cancelled);
    });
  });
});
