jest.mock('../../../src/config/supabase', () => {
  const mock = require('../../helpers/mockSupabase');
  return {
    __esModule: true,
    default: mock,
    supabase: mock,
    supabaseAdmin: mock,
  };
});

jest.mock('../../../src/repositories/product.repository');

import mockSupabase from '../../helpers/mockSupabase';
import * as productRepository from '../../../src/repositories/product.repository';
import * as syncService from '../../../src/services/sync.service';

const mockedRepo = productRepository as jest.Mocked<typeof productRepository>;

function buildApiProduct(overrides: Record<string, string> = {}) {
  return {
    id: '7790001234567',
    nombre: 'Galletitas Crackers',
    marca: 'Pepitos',
    precioMax: '850.50',
    imagen: 'https://img.example.com/prod.jpg',
    ...overrides,
  };
}

function makeFetchResponse(productos: unknown[]) {
  return {
    ok: true,
    json: async () => ({ productos }),
  } as unknown as Response;
}

describe('SyncService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      PRECIOS_CLAROS_URL: 'https://test.preciosclaros.gob.ar',
      MVP_STORE_PRECIOS_CLAROS_ID: 'store-42',
      ADMIN_TOKEN: 'test-admin-token',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('syncPreciosClaros', () => {
    it('sincroniza productos correctamente y retorna estadísticas', async () => {
      const products = [
        buildApiProduct(),
        buildApiProduct({ id: '7790009876543', nombre: 'Arroz Largo Fino', marca: 'Gallo', precioMax: '1200.00' }),
      ];

      const fetchSpy = jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce(makeFetchResponse(products));

      mockedRepo.upsertByBarcode
        .mockResolvedValueOnce({ created: true })
        .mockResolvedValueOnce({ created: false });

      const result = await syncService.syncPreciosClaros();

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://test.preciosclaros.gob.ar/productos?string=&limit=100&offset=0&id_sucursal=store-42',
        expect.objectContaining({
          headers: expect.objectContaining({ 'User-Agent': expect.any(String) }),
        }),
      );

      expect(mockedRepo.upsertByBarcode).toHaveBeenCalledTimes(2);
      expect(mockedRepo.upsertByBarcode).toHaveBeenCalledWith({
        barcode: '7790001234567',
        name: 'Galletitas Crackers',
        brand: 'Pepitos',
        price: 850.50,
        image_url: 'https://img.example.com/prod.jpg',
      });

      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.errors).toBe(0);
      expect(typeof result.duration_ms).toBe('number');

      expect(mockSupabase.from).toHaveBeenCalledWith('stores');
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ synced_at: expect.any(String) }),
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith('precios_claros_id', 'store-42');
    });

    it('maneja errores de productos individuales sin abortar', async () => {
      const products = [
        buildApiProduct({ id: '111' }),
        buildApiProduct({ id: '222' }),
        buildApiProduct({ id: '333' }),
      ];

      jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce(makeFetchResponse(products));

      mockedRepo.upsertByBarcode
        .mockResolvedValueOnce({ created: true })
        .mockRejectedValueOnce(new Error('DB connection lost'))
        .mockResolvedValueOnce({ created: false });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await syncService.syncPreciosClaros();

      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.errors).toBe(1);
      expect(mockedRepo.upsertByBarcode).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error syncing product:',
        '222',
        expect.any(Error),
      );
    });

    it('retorna created=0 updated=0 si la API devuelve lista vacía', async () => {
      jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce(makeFetchResponse([]));

      const result = await syncService.syncPreciosClaros();

      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockedRepo.upsertByBarcode).not.toHaveBeenCalled();
    });

    it('si la API devuelve respuesta sin field productos, no procesa nada', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as unknown as Response);

      const result = await syncService.syncPreciosClaros();

      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(mockedRepo.upsertByBarcode).not.toHaveBeenCalled();
    });

    it('pagina: si primera pagina trae 100, hace segunda llamada con offset=100', async () => {
      const fullPage = Array.from({ length: 100 }, (_, i) =>
        buildApiProduct({ id: `prod-${i}` }),
      );
      const secondPage = [buildApiProduct({ id: 'prod-100' })];

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(makeFetchResponse(fullPage))
        .mockResolvedValueOnce(makeFetchResponse(secondPage));

      mockedRepo.upsertByBarcode.mockResolvedValue({ created: true });

      const result = await syncService.syncPreciosClaros();

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('offset=100'),
        expect.any(Object),
      );
      expect(result.created).toBe(101);
    });

    it('respeta MAX_PRODUCTS=1000 y para de paginar', async () => {
      const fullPage = Array.from({ length: 100 }, (_, i) =>
        buildApiProduct({ id: `p-${i}` }),
      );

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() => Promise.resolve(makeFetchResponse(fullPage)));

      mockedRepo.upsertByBarcode.mockResolvedValue({ created: true });

      const result = await syncService.syncPreciosClaros();

      // 1000 productos = 10 paginas exactas
      expect(fetchSpy).toHaveBeenCalledTimes(10);
      expect(result.created).toBe(1000);
    });
  });
});
