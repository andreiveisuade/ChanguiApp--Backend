jest.mock('../../../src/config/supabase', () => require('../../helpers/mockSupabase'));

import mockSupabase from '../../helpers/mockSupabase';
import * as checkoutRepository from '../../../src/repositories/checkout.repository';
import { validCart, validPurchase } from '../../helpers/testData';

describe('CheckoutRepository.savePreferenceId', () => {
  afterEach(() => jest.clearAllMocks());

  it('actualiza mp_preference_id del carrito por id', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

    await checkoutRepository.savePreferenceId('cart-uuid-1', 'pref-uuid-1');

    expect(mockSupabase.from).toHaveBeenCalledWith('carts');
    expect(mockSupabase.update).toHaveBeenCalledWith({ mp_preference_id: 'pref-uuid-1' });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'cart-uuid-1');
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(
      checkoutRepository.savePreferenceId('cart-uuid-1', 'pref-uuid-1'),
    ).rejects.toThrow('boom');
  });
});

describe('CheckoutRepository.findPurchaseByPreferenceId', () => {
  afterEach(() => jest.clearAllMocks());

  it('devuelve la compra cuando hay data', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: validPurchase, error: null });

    const result = await checkoutRepository.findPurchaseByPreferenceId(
      'user-uuid-1',
      'pref-uuid-1',
    );

    expect(mockSupabase.from).toHaveBeenCalledWith('purchases');
    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-uuid-1');
    expect(mockSupabase.eq).toHaveBeenCalledWith('mp_preference_id', 'pref-uuid-1');
    expect(result).toEqual(validPurchase);
  });

  it('devuelve null si no hay data', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(
      await checkoutRepository.findPurchaseByPreferenceId('user-uuid-1', 'pref-uuid-1'),
    ).toBeNull();
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(
      checkoutRepository.findPurchaseByPreferenceId('user-uuid-1', 'pref-uuid-1'),
    ).rejects.toThrow('boom');
  });
});

describe('CheckoutRepository.findCartById', () => {
  afterEach(() => jest.clearAllMocks());

  it('devuelve el carrito cuando hay data', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: validCart, error: null });

    const result = await checkoutRepository.findCartById('cart-uuid-1');

    expect(mockSupabase.from).toHaveBeenCalledWith('carts');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'cart-uuid-1');
    expect(result).toEqual(validCart);
  });

  it('devuelve null si no hay data', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(await checkoutRepository.findCartById('cart-uuid-1')).toBeNull();
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(checkoutRepository.findCartById('cart-uuid-1')).rejects.toThrow('boom');
  });
});

describe('CheckoutRepository.createPurchase', () => {
  afterEach(() => jest.clearAllMocks());

  it('inserta y devuelve la compra creada', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: validPurchase, error: null });

    const input = {
      user_id: 'user-uuid-1',
      store_id: 'store-uuid-1',
      total: 3000,
      payment_id: 'MP-123456',
      payment_status: 'approved',
    } as any;

    const result = await checkoutRepository.createPurchase(input);

    expect(mockSupabase.from).toHaveBeenCalledWith('purchases');
    expect(mockSupabase.insert).toHaveBeenCalledWith(input);
    expect(result).toEqual(validPurchase);
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(checkoutRepository.createPurchase({} as any)).rejects.toThrow('boom');
  });
});

describe('CheckoutRepository.insertPurchaseItems', () => {
  afterEach(() => jest.clearAllMocks());

  const rows = [
    {
      purchase_id: 'purchase-uuid-1',
      product_name: 'Coca Cola 500ml',
      barcode: '7790895000782',
      quantity: 2,
      unit_price: 1500,
      tax_rate: 21,
    },
  ];

  it('inserta las filas sin lanzar', async () => {
    mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null });

    await checkoutRepository.insertPurchaseItems(rows);

    expect(mockSupabase.from).toHaveBeenCalledWith('purchase_items');
    expect(mockSupabase.insert).toHaveBeenCalledWith(rows);
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.insert.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(checkoutRepository.insertPurchaseItems(rows)).rejects.toThrow('boom');
  });
});

describe('CheckoutRepository.closeCart', () => {
  afterEach(() => jest.clearAllMocks());

  it('marca el carrito como closed por id', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

    await checkoutRepository.closeCart('cart-uuid-1');

    expect(mockSupabase.from).toHaveBeenCalledWith('carts');
    expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'closed' });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'cart-uuid-1');
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(checkoutRepository.closeCart('cart-uuid-1')).rejects.toThrow('boom');
  });
});
