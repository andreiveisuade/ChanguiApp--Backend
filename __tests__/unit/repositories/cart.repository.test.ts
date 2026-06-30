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

    it('lanza error si supabase falla', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: new Error('boom') });

      await expect(cartRepository.findActiveCartByUserId(validCart.user_id)).rejects.toThrow(
        'boom',
      );
    });
  });

  describe('createCart', () => {
    it('crea un carrito nuevo con status active', async () => {
      mockSupabase.single.mockResolvedValue({ data: validCart, error: null });

      const result = await cartRepository.createCart(validCart.user_id);

      expect(mockSupabase.from).toHaveBeenCalledWith('carts');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: validCart.user_id,
        status: 'active',
      });
      expect(result).toEqual(validCart);
    });

    it('lanza error si supabase falla', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('boom') });

      await expect(
        cartRepository.createCart(validCart.user_id),
      ).rejects.toThrow('boom');
    });
  });

  describe('addOrUpdateItem', () => {
    it('hace upsert de item en cart_items', async () => {
      mockSupabase.single.mockResolvedValue({ data: validCartItem, error: null });

      const result = await cartRepository.addOrUpdateItem(
        validCart.id,
        validProduct.id,
        validCartItem.quantity,
        validCartItem.unit_price,
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        {
          cart_id: validCart.id,
          product_id: validProduct.id,
          quantity: validCartItem.quantity,
          unit_price: validCartItem.unit_price,
        },
        { onConflict: 'cart_id,product_id', ignoreDuplicates: false },
      );
      expect(result).toEqual(validCartItem);
    });

    it('lanza error si supabase falla', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('boom') });

      await expect(
        cartRepository.addOrUpdateItem(
          validCart.id,
          validProduct.id,
          validCartItem.quantity,
          validCartItem.unit_price,
        ),
      ).rejects.toThrow('boom');
    });
  });

  describe('findItemOwnership', () => {
    it('retorna ownership (item + dueño y estado del carrito) por id', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: {
          id: validCartItem.id,
          cart_id: validCart.id,
          cart: { user_id: validCart.user_id, status: 'active' },
        },
        error: null,
      });

      const result = await cartRepository.findItemOwnership(validCartItem.id);

      expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', validCartItem.id);
      expect(result).toEqual({
        id: validCartItem.id,
        cart_id: validCart.id,
        user_id: validCart.user_id,
        status: 'active',
      });
    });

    it('retorna null si el item no existe', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await cartRepository.findItemOwnership('no-item');

      expect(result).toBeNull();
    });

    it('lanza error si supabase falla', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: new Error('boom') });

      await expect(cartRepository.findItemOwnership(validCartItem.id)).rejects.toThrow('boom');
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

    it('lanza error si supabase falla', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('boom') });

      await expect(cartRepository.updateItemQuantity(validCartItem.id, 5)).rejects.toThrow('boom');
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

    it('lanza error si supabase falla', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('boom') });

      await expect(cartRepository.removeItem(validCartItem.id)).rejects.toThrow('boom');
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

    it('lanza error si supabase falla', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('boom') });

      await expect(cartRepository.cancelCart(validCart.id)).rejects.toThrow('boom');
    });
  });
});
