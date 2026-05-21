jest.mock('../../../src/config/supabase', () => require('../../helpers/mockSupabase'));

import mockSupabase from '../../helpers/mockSupabase';
import * as productRepository from '../../../src/repositories/product.repository';

describe('ProductRepository.upsertBatch', () => {
  afterEach(() => jest.clearAllMocks());

  it('no llama a supabase si el array está vacío', async () => {
    await productRepository.upsertBatch([]);

    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(mockSupabase.upsert).not.toHaveBeenCalled();
  });

  it('llama upsert con array completo y onConflict=barcode', async () => {
    mockSupabase.upsert.mockResolvedValue({ data: null, error: null });

    const products = [
      { barcode: '111', name: 'A', price: 100 },
      { barcode: '222', name: 'B', price: 200 },
    ];

    await productRepository.upsertBatch(products);

    expect(mockSupabase.from).toHaveBeenCalledWith('products');
    expect(mockSupabase.upsert).toHaveBeenCalledWith(products, {
      onConflict: 'barcode',
    });
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.upsert.mockResolvedValue({
      data: null,
      error: new Error('insert failed'),
    });

    await expect(
      productRepository.upsertBatch([{ barcode: '111', name: 'A', price: 1 }]),
    ).rejects.toThrow('insert failed');
  });
});
