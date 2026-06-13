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
    mockSupabase.maybeSingle.mockResolvedValue({
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
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await productRepository.findByBarcode('000')).toBeNull();
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: new Error('boom') });
    await expect(productRepository.findByBarcode('000')).rejects.toThrow('boom');
  });
});

describe('ProductRepository.getAllForClassification', () => {
  afterEach(() => jest.clearAllMocks());

  it('devuelve los productos no bloqueados (una página)', async () => {
    mockSupabase.range.mockResolvedValueOnce({ data: [{ id: 'p1', name: 'A' }], error: null });

    const result = await productRepository.getAllForClassification();

    expect(mockSupabase.from).toHaveBeenCalledWith('products');
    expect(mockSupabase.eq).toHaveBeenCalledWith('tax_locked', false);
    expect(mockSupabase.range).toHaveBeenCalledWith(0, 999);
    expect(result).toEqual([{ id: 'p1', name: 'A' }]);
  });

  it('pagina cuando hay más de 1000 productos', async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) => ({ id: `p${i}`, name: 'X' }));
    mockSupabase.range
      .mockResolvedValueOnce({ data: fullPage, error: null })
      .mockResolvedValueOnce({ data: [{ id: 'p1000', name: 'Y' }], error: null });

    const result = await productRepository.getAllForClassification();

    expect(result).toHaveLength(1001);
    expect(mockSupabase.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(mockSupabase.range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });
});

describe('ProductRepository.findUpdatedSince', () => {
  afterEach(() => jest.clearAllMocks());

  it('filtra por updated_at > since, ordena, pagina y normaliza el embed tax', async () => {
    const rows = [
      { id: 'p1', barcode: '111', name: 'A', brand: 'X', price: 100, image_url: null, updated_at: '2026-06-08T10:00:00Z', tax_category: [{ name: 'General', rate: 21 }] },
    ];
    mockSupabase.range.mockResolvedValueOnce({ data: rows, error: null });

    const result = await productRepository.findUpdatedSince('2026-06-01T00:00:00Z', 500, 0);

    expect(mockSupabase.from).toHaveBeenCalledWith('products');
    expect(mockSupabase.gt).toHaveBeenCalledWith('updated_at', '2026-06-01T00:00:00Z');
    expect(mockSupabase.order).toHaveBeenCalledWith('updated_at', { ascending: true });
    expect(mockSupabase.order).toHaveBeenCalledWith('id', { ascending: true });
    expect(mockSupabase.range).toHaveBeenCalledWith(0, 499);
    // el embed array de Supabase queda normalizado a objeto único
    expect(result[0].tax_category).toEqual({ name: 'General', rate: 21 });
  });

  it('normaliza tax_category ausente a null', async () => {
    const rows = [
      { id: 'p1', barcode: '111', name: 'A', brand: null, price: 100, image_url: null, updated_at: '2026-06-08T10:00:00Z', tax_category: null },
    ];
    mockSupabase.range.mockResolvedValueOnce({ data: rows, error: null });

    const result = await productRepository.findUpdatedSince('2026-06-01T00:00:00Z', 100, 200);

    expect(result[0].tax_category).toBeNull();
    expect(mockSupabase.range).toHaveBeenCalledWith(200, 299);
  });

  it('devuelve [] cuando data es null', async () => {
    mockSupabase.range.mockResolvedValueOnce({ data: null, error: null });
    expect(await productRepository.findUpdatedSince('2026-06-01T00:00:00Z', 100, 200)).toEqual([]);
  });

  it('lanza el error de supabase', async () => {
    mockSupabase.range.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(
      productRepository.findUpdatedSince('2026-06-01T00:00:00Z', 100, 0),
    ).rejects.toThrow('boom');
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

  it('parte en chunks cuando hay muchos ids (evita el límite de URL)', async () => {
    mockSupabase.eq.mockResolvedValue({ data: null, error: null });
    const ids = Array.from({ length: 250 }, (_, i) => `p${i}`);

    await productRepository.bulkSetCategory('carnes', ids);

    expect(mockSupabase.update).toHaveBeenCalledTimes(2);
    expect(mockSupabase.in).toHaveBeenNthCalledWith(1, 'id', ids.slice(0, 200));
    expect(mockSupabase.in).toHaveBeenNthCalledWith(2, 'id', ids.slice(200));
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
