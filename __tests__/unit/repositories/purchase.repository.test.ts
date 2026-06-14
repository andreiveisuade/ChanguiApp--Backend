jest.mock('../../../src/config/supabase', () => require('../../helpers/mockSupabase'));

import mockSupabase from '../../helpers/mockSupabase';
import * as purchaseRepository from '../../../src/repositories/purchase.repository';

describe('PurchaseRepository.findByUserId', () => {
  afterEach(() => jest.clearAllMocks());

  it('sin status no filtra por payment_status y devuelve la data ordenada', async () => {
    const rows = [{ id: 'pu1', total: 100, payment_status: 'approved' }];
    mockSupabase.order.mockResolvedValueOnce({ data: rows, error: null });

    const result = await purchaseRepository.findByUserId('u1');

    expect(mockSupabase.from).toHaveBeenCalledWith('purchases');
    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(mockSupabase.eq).not.toHaveBeenCalledWith('payment_status', expect.anything());
    expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual(rows);
  });

  it('con status filtra por payment_status', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: [], error: null });

    await purchaseRepository.findByUserId('u1', 'approved');

    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(mockSupabase.eq).toHaveBeenCalledWith('payment_status', 'approved');
  });

  it('devuelve [] cuando data es null', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: null });
    expect(await purchaseRepository.findByUserId('u1')).toEqual([]);
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(purchaseRepository.findByUserId('u1')).rejects.toThrow('boom');
  });
});

describe('PurchaseRepository.findByIdAndUser', () => {
  afterEach(() => jest.clearAllMocks());

  it('devuelve la compra filtrando por id y user_id', async () => {
    const purchase = { id: 'pu1', user_id: 'u1', items: [] };
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: purchase, error: null });

    const result = await purchaseRepository.findByIdAndUser('pu1', 'u1');

    expect(mockSupabase.from).toHaveBeenCalledWith('purchases');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'pu1');
    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(result).toEqual(purchase);
  });

  it('devuelve null cuando data es null', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(await purchaseRepository.findByIdAndUser('pu1', 'u1')).toBeNull();
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(purchaseRepository.findByIdAndUser('pu1', 'u1')).rejects.toThrow('boom');
  });
});
