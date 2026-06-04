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

describe('ProductRepository.findByBarcode', () => {
  afterEach(() => jest.clearAllMocks());

  it('normaliza el embed array de tax_category a objeto', async () => {
    mockSupabase.single.mockResolvedValue({
      data: {
        id: 'p1',
        barcode: '111',
        name: 'Leche',
        price: 850,
        tax_category: [{ id: 'leche', name: 'Leche fluida', rate: 0 }],
      },
      error: null,
    });

    const result = await productRepository.findByBarcode('111');

    expect(result?.tax_category).toEqual({ id: 'leche', name: 'Leche fluida', rate: 0 });
  });

  it('devuelve null si no hay data', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: null });
    expect(await productRepository.findByBarcode('000')).toBeNull();
  });

  it('devuelve null ante PGRST116 (no encontrado)', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    expect(await productRepository.findByBarcode('000')).toBeNull();
  });
});

describe('ProductRepository.getAllForClassification', () => {
  afterEach(() => jest.clearAllMocks());

  it('devuelve los productos no bloqueados', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: [{ id: 'p1', name: 'A' }], error: null });

    const result = await productRepository.getAllForClassification();

    expect(mockSupabase.from).toHaveBeenCalledWith('products');
    expect(mockSupabase.eq).toHaveBeenCalledWith('tax_locked', false);
    expect(result).toEqual([{ id: 'p1', name: 'A' }]);
  });
});

describe('ProductRepository.bulkSetCategory', () => {
  afterEach(() => jest.clearAllMocks());

  it('no llama a supabase si no hay ids', async () => {
    await productRepository.bulkSetCategory('carnes', []);
    expect(mockSupabase.update).not.toHaveBeenCalled();
  });

  it('actualiza la categoría de los productos indicados, sólo no bloqueados', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

    await productRepository.bulkSetCategory('carnes', ['p1', 'p2']);

    expect(mockSupabase.update).toHaveBeenCalledWith({ tax_category_id: 'carnes' });
    expect(mockSupabase.in).toHaveBeenCalledWith('id', ['p1', 'p2']);
    expect(mockSupabase.eq).toHaveBeenCalledWith('tax_locked', false);
  });
});

describe('ProductRepository.updateTaxCategory', () => {
  afterEach(() => jest.clearAllMocks());

  it('marca updated=true y bloquea si el producto existe', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({ data: { id: 'p1' }, error: null });

    const result = await productRepository.updateTaxCategory('111', 'carnes');

    expect(mockSupabase.update).toHaveBeenCalledWith({
      tax_category_id: 'carnes',
      tax_locked: true,
    });
    expect(result).toEqual({ updated: true });
  });

  it('marca updated=false si el producto no existe', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await productRepository.updateTaxCategory('000', 'carnes')).toEqual({ updated: false });
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: new Error('boom') });
    await expect(productRepository.updateTaxCategory('1', 'carnes')).rejects.toThrow('boom');
  });
});
