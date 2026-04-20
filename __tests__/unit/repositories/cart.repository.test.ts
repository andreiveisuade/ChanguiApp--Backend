jest.mock('../../../src/config/supabase', () => require('../../helpers/mockSupabase'));

const mockSupabase = require('../../helpers/mockSupabase');
const cartRepository = require('../../../src/repositories/cart.repository');
const { validCart, validCartItem, validProduct } = require('../../helpers/testData');

describe('CartRepository', () => {
  afterEach(() => jest.clearAllMocks());

  describe('findActiveByUserId', () => {
    it('busca carrito con status=active para el usuario', async () => {
      mockSupabase.single.mockResolvedValue({ data: validCart, error: null });

      const result = await cartRepository.findActiveByUserId(validCart.user_id);

      expect(mockSupabase.from).toHaveBeenCalledWith('carts');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', validCart.user_id);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'active');
      expect(result).toEqual(validCart);
    });
  });

  describe('addItem', () => {
    it('inserta en cart_items con cart_id, product_id, quantity', async () => {
      mockSupabase.single.mockResolvedValue({ data: validCartItem, error: null });

      const result = await cartRepository.addItem(
        validCart.id,
        validProduct.id,
        validCartItem.quantity
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        cart_id: validCart.id,
        product_id: validProduct.id,
        quantity: validCartItem.quantity,
      });
      expect(result).toEqual(validCartItem);
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

  describe('deleteItem', () => {
    it('elimina item por id', async () => {
      mockSupabase.eq.mockResolvedValue({ error: null });

      await cartRepository.deleteItem(validCartItem.id);

      expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', validCartItem.id);
    });
  });
});
