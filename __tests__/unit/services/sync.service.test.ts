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
jest.mock('../../../src/repositories/sync_jobs.repository');

import * as productRepository from '../../../src/repositories/product.repository';
import * as syncJobsRepository from '../../../src/repositories/sync_jobs.repository';
import * as syncService from '../../../src/services/sync.service';
import type { SyncJob } from '../../../src/types/domain';

const mockedProducts = productRepository as jest.Mocked<typeof productRepository>;
const mockedJobs = syncJobsRepository as jest.Mocked<typeof syncJobsRepository>;

const JOB_ID = 'job-uuid-1';

function buildJob(overrides: Partial<SyncJob> = {}): SyncJob {
  return {
    id: JOB_ID,
    type: 'precios_claros',
    status: 'running',
    total_target: null,
    processed: 0,
    errors: 0,
    last_offset: 0,
    error_message: null,
    started_at: '2026-05-21T00:00:00Z',
    completed_at: null,
    created_at: '2026-05-21T00:00:00Z',
    ...overrides,
  };
}

function apiProduct(id: string) {
  return {
    id,
    nombre: `Prod ${id}`,
    marca: 'Marca',
    precioMax: '100.50',
    imagen: 'https://img.example.com/p.jpg',
  };
}

function fetchResponse(body: unknown): Response {
  return { ok: true, json: async () => body } as unknown as Response;
}

// El runner se dispara en background (void); drenamos los microtasks para que
// termine con el fetch mockeado y no filtre una llamada real al afterEach.
async function drain(): Promise<void> {
  await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
}

// fetch es un binding nativo en Node 20+ (no spyable con jest.spyOn). Lo mockeamos
// por asignacion directa a global.fetch y restauramos el original en afterEach.
const realFetch = global.fetch;
function mockFetch(): jest.MockedFunction<typeof fetch> {
  const fn = jest.fn() as unknown as jest.MockedFunction<typeof fetch>;
  (global as { fetch: typeof fetch }).fetch = fn;
  return fn;
}

describe('SyncService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      PRECIOS_CLAROS_URL: 'https://test.preciosclaros.gob.ar',
      MVP_STORE_PRECIOS_CLAROS_ID: 'store-42',
      SYNC_DELAY_MS: '0',
      SYNC_RETRY_BASE_MS: '0',
    };
    mockedJobs.findRunning.mockResolvedValue(null);
    mockedJobs.findLatest.mockResolvedValue(null);
    mockedJobs.create.mockResolvedValue(buildJob());
    mockedJobs.setTotal.mockResolvedValue(undefined);
    mockedJobs.updateProgress.mockResolvedValue(undefined);
    mockedJobs.markCompleted.mockResolvedValue(undefined);
    mockedJobs.markPartial.mockResolvedValue(undefined);
    mockedJobs.markFailed.mockResolvedValue(undefined);
    mockedProducts.upsertBatch.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
    jest.restoreAllMocks();
    (global as { fetch: typeof fetch }).fetch = realFetch;
  });

  describe('startPreciosClarosSync', () => {
    it('crea job y devuelve sync_id cuando no hay running', async () => {
      mockFetch().mockResolvedValue(fetchResponse({ total: 0, productos: [] }));

      const result = await syncService.startPreciosClarosSync();

      expect(mockedJobs.findRunning).toHaveBeenCalledWith('precios_claros');
      expect(mockedJobs.create).toHaveBeenCalledWith('precios_claros');
      expect(result).toEqual({ sync_id: JOB_ID });

      // el runner se dispara en background (void); drenamos para que termine
      // con el fetch mockeado y no filtre una llamada real al afterEach siguiente
      await drain();
    });

    it('lanza ApiError 409 si ya hay un sync running reciente', async () => {
      mockedJobs.findRunning.mockResolvedValue(buildJob({ started_at: new Date().toISOString() }));

      await expect(syncService.startPreciosClarosSync()).rejects.toMatchObject({
        status: 409,
        message: 'Ya hay un sync en curso',
      });
      expect(mockedJobs.create).not.toHaveBeenCalled();
    });

    it('recupera un running huérfano (stale): lo marca failed y arranca uno nuevo', async () => {
      // started_at viejo (default de buildJob) => stale => huérfano por reinicio.
      mockedJobs.findRunning.mockResolvedValue(
        buildJob({ id: 'huerfano', started_at: '2026-05-21T00:00:00Z' }),
      );
      mockFetch().mockResolvedValue(fetchResponse({ total: 0, productos: [] }));

      const result = await syncService.startPreciosClarosSync();

      expect(mockedJobs.markFailed).toHaveBeenCalledWith(
        'huerfano',
        expect.stringContaining('huérfano'),
      );
      expect(mockedJobs.create).toHaveBeenCalledWith('precios_claros');
      expect(result).toEqual({ sync_id: JOB_ID });

      await drain();
    });

    it('reanuda desde el last_offset del último job no completado', async () => {
      mockedJobs.findLatest.mockResolvedValue(
        buildJob({ status: 'partial', total_target: 500, last_offset: 200 }),
      );
      const runSpy = mockFetch().mockResolvedValue(fetchResponse({ total: 500, productos: [] }));

      await syncService.startPreciosClarosSync();
      await drain();

      // el head se pide en offset 0, pero la primera página de datos arranca en 200
      expect(runSpy).toHaveBeenCalledWith(expect.stringContaining('offset=200'), expect.anything());
    });

    // El offset de arranque vuelve a 0 cuando no hay nada reanudable: último
    // job completado, sin progreso, o con el total ya cubierto.
    it.each([
      ['el último job ya completó', 'completed' as const, 500, 500],
      ['el último job no tiene progreso', 'failed' as const, 500, 0],
      ['el último partial ya cubrió el total', 'partial' as const, 200, 200],
    ])('arranca de 0 cuando %s', async (_caso, status, total_target, last_offset) => {
      mockedJobs.findLatest.mockResolvedValue(buildJob({ status, total_target, last_offset }));
      const runSpy = mockFetch().mockResolvedValue(fetchResponse({ total: 0, productos: [] }));

      await syncService.startPreciosClarosSync();
      await drain();

      expect(runSpy).toHaveBeenCalledWith(expect.stringContaining('offset=0'), expect.anything());
    });

    it('loguea si el runner de background rechaza sin atrapar', async () => {
      mockFetch().mockResolvedValue(fetchResponse({ total: 0, productos: [] }));
      // total=0 dispara markFailed; si markFailed también rompe, el runner
      // rechaza y debe caer en el .catch defensivo (no romper el proceso).
      mockedJobs.markFailed.mockRejectedValue(new Error('db down'));
      const errSpy = jest.spyOn(console, 'error').mockImplementation();

      await syncService.startPreciosClarosSync();
      await drain();

      expect(errSpy).toHaveBeenCalledWith('[sync] runner falló sin atrapar:', expect.any(Error));
    });

    it('dispara el runner en background (side-effect: el runner llega a setTotal)', async () => {
      mockFetch().mockResolvedValue(fetchResponse({ total: 5, productos: [apiProduct('p-1')] }));

      await syncService.startPreciosClarosSync();
      await drain();

      expect(mockedJobs.setTotal).toHaveBeenCalledWith(JOB_ID, 5);
    });
  });

  describe('runPreciosClarosSync', () => {
    it('marca failed si falta PRECIOS_CLAROS_URL', async () => {
      delete process.env.PRECIOS_CLAROS_URL;

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        expect.stringContaining('no configurado'),
      );
    });

    it('marca failed si falta MVP_STORE_PRECIOS_CLAROS_ID', async () => {
      delete process.env.MVP_STORE_PRECIOS_CLAROS_ID;

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        expect.stringContaining('no configurado'),
      );
    });

    it('happy path: setea total, recorre páginas, batch upsert, marca completed', async () => {
      const fullPage = Array.from({ length: 100 }, (_, i) => apiProduct(`p-${i}`));
      const tailPage = [apiProduct('p-100'), apiProduct('p-101')];

      const fetchSpy = mockFetch()
        .mockResolvedValueOnce(fetchResponse({ total: 102, productos: [apiProduct('head')] }))
        .mockResolvedValueOnce(fetchResponse({ total: 102, productos: fullPage }))
        .mockResolvedValueOnce(fetchResponse({ total: 102, productos: tailPage }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.setTotal).toHaveBeenCalledWith(JOB_ID, 102);
      expect(fetchSpy).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('limit=1&offset=0'),
        expect.any(Object),
      );
      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('limit=100&offset=0'),
        expect.any(Object),
      );
      expect(fetchSpy).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('limit=100&offset=100'),
        expect.any(Object),
      );

      expect(mockedProducts.upsertBatch).toHaveBeenCalledTimes(2);
      expect(mockedProducts.upsertBatch).toHaveBeenNthCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({ barcode: 'p-0', name: 'Prod p-0', price: 100.5 }),
        ]),
      );

      expect(mockedJobs.updateProgress).toHaveBeenLastCalledWith(JOB_ID, 102, 102, 0);
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
      expect(mockedJobs.markFailed).not.toHaveBeenCalled();
    });

    it('total=0: no fetchea productos y marca FAILED (no completed)', async () => {
      mockFetch().mockResolvedValueOnce(fetchResponse({ total: 0, productos: [] }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.setTotal).toHaveBeenCalledWith(JOB_ID, 0);
      expect(mockedProducts.upsertBatch).not.toHaveBeenCalled();
      expect(mockedJobs.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        expect.stringContaining('0 productos'),
      );
      expect(mockedJobs.markCompleted).not.toHaveBeenCalled();
    });

    it('cuando upsertBatch falla, suma a errors y sigue (no aborta)', async () => {
      const page = [apiProduct('p-1'), apiProduct('p-2')];

      mockFetch()
        .mockResolvedValueOnce(fetchResponse({ total: 2, productos: [apiProduct('head')] }))
        .mockResolvedValueOnce(fetchResponse({ total: 2, productos: page }));

      mockedProducts.upsertBatch.mockRejectedValueOnce(new Error('DB down'));
      jest.spyOn(console, 'error').mockImplementation();

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.updateProgress).toHaveBeenLastCalledWith(JOB_ID, 0, 2, 2);
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
    });

    it('marca failed si el primer fetch tira', async () => {
      mockFetch().mockRejectedValue(new Error('SEPA down'));
      jest.spyOn(console, 'error').mockImplementation();

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.markFailed).toHaveBeenCalledWith(JOB_ID, 'SEPA down');
      expect(mockedJobs.markCompleted).not.toHaveBeenCalled();
    });

    it('para temprano si la página devuelve menos del PAGE_LIMIT', async () => {
      mockFetch()
        .mockResolvedValueOnce(fetchResponse({ total: 500, productos: [apiProduct('head')] }))
        .mockResolvedValueOnce(fetchResponse({ total: 500, productos: [apiProduct('p-1')] }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
    });

    it('para si la página devuelve productos vacíos antes del total', async () => {
      mockFetch()
        .mockResolvedValueOnce(fetchResponse({ total: 500, productos: [apiProduct('head')] }))
        .mockResolvedValueOnce(fetchResponse({ total: 500, productos: [] }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedProducts.upsertBatch).not.toHaveBeenCalled();
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
    });

    it('aplica delay configurable cuando SYNC_DELAY_MS > 0', async () => {
      process.env.SYNC_DELAY_MS = '5';
      const fullPage = Array.from({ length: 100 }, (_, i) => apiProduct(`p-${i}`));

      mockFetch()
        .mockResolvedValueOnce(fetchResponse({ total: 200, productos: [apiProduct('head')] }))
        .mockResolvedValueOnce(fetchResponse({ total: 200, productos: fullPage }))
        .mockResolvedValueOnce(fetchResponse({ total: 200, productos: fullPage }));

      const t0 = Date.now();
      await syncService.runPreciosClarosSync(JOB_ID);
      const elapsed = Date.now() - t0;

      expect(elapsed).toBeGreaterThanOrEqual(5);
      expect(mockedJobs.markCompleted).toHaveBeenCalled();
    });

    it('cae al default de 2000ms si SYNC_DELAY_MS es inválido (no afecta cuando total=0)', async () => {
      process.env.SYNC_DELAY_MS = 'no-es-numero';

      mockFetch().mockResolvedValueOnce(fetchResponse({ total: 0, productos: [] }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.markFailed).toHaveBeenCalled();
    });

    it('si total ausente en la respuesta, lo trata como 0 y marca FAILED', async () => {
      mockFetch().mockResolvedValueOnce(fetchResponse({ productos: [] }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.setTotal).toHaveBeenCalledWith(JOB_ID, 0);
      expect(mockedJobs.markFailed).toHaveBeenCalled();
      expect(mockedJobs.markCompleted).not.toHaveBeenCalled();
    });

    it('reintenta cuando la respuesta no es ok y se recupera (HTTP 429 → 200)', async () => {
      const errorResponse = {
        ok: false,
        status: 429,
        json: async () => ({}),
      } as unknown as Response;
      jest.spyOn(console, 'error').mockImplementation();
      mockFetch()
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(fetchResponse({ total: 1, productos: [apiProduct('p-1')] }))
        .mockResolvedValueOnce(fetchResponse({ total: 1, productos: [apiProduct('p-1')] }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.setTotal).toHaveBeenCalledWith(JOB_ID, 1);
      expect(mockedProducts.upsertBatch).toHaveBeenCalled();
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
    });

    it('marca failed si la API responde no-ok en todos los reintentos', async () => {
      process.env.SYNC_MAX_RETRIES = '2';
      const errorResponse = {
        ok: false,
        status: 503,
        json: async () => ({}),
      } as unknown as Response;
      jest.spyOn(console, 'error').mockImplementation();
      const fetchSpy = mockFetch().mockResolvedValue(errorResponse);

      await syncService.runPreciosClarosSync(JOB_ID);

      // 1 intento + 2 reintentos = 3 llamadas antes de abortar
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(mockedJobs.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        expect.stringContaining('HTTP 503'),
      );
      expect(mockedJobs.markCompleted).not.toHaveBeenCalled();
    });

    it('captura errores no-Error y los stringifica para markFailed', async () => {
      mockFetch().mockResolvedValue(fetchResponse({ total: 5, productos: [apiProduct('p-1')] }));
      mockedJobs.setTotal.mockRejectedValueOnce('string-error');
      jest.spyOn(console, 'error').mockImplementation();

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.markFailed).toHaveBeenCalledWith(JOB_ID, 'string-error');
    });

    it('corta por el techo del chunk y deja el job en partial (no completed)', async () => {
      process.env.SYNC_MAX_PAGES_PER_RUN = '1';
      const fullPage = Array.from({ length: 100 }, (_, i) => apiProduct(`p-${i}`));

      mockFetch()
        .mockResolvedValueOnce(fetchResponse({ total: 500, productos: [apiProduct('head')] }))
        .mockResolvedValueOnce(fetchResponse({ total: 500, productos: fullPage }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedProducts.upsertBatch).toHaveBeenCalledTimes(1);
      expect(mockedJobs.markPartial).toHaveBeenCalledWith(JOB_ID, 100);
      expect(mockedJobs.markCompleted).not.toHaveBeenCalled();
    });

    it('reanuda desde startOffset: la primera página de datos arranca ahí', async () => {
      const fetchSpy = mockFetch()
        .mockResolvedValueOnce(fetchResponse({ total: 202, productos: [apiProduct('head')] }))
        .mockResolvedValueOnce(
          fetchResponse({ total: 202, productos: [apiProduct('p-200'), apiProduct('p-201')] }),
        );

      await syncService.runPreciosClarosSync(JOB_ID, 200);

      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('limit=100&offset=200'),
        expect.any(Object),
      );
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
      expect(mockedJobs.markPartial).not.toHaveBeenCalled();
    });
  });

  describe('ingestProductsBatch', () => {
    it('mapea los productos crudos y los upsertea, devolviendo la cantidad', async () => {
      const productos = [apiProduct('779-1'), apiProduct('779-2')];

      const count = await syncService.ingestProductsBatch(productos);

      expect(count).toBe(2);
      expect(mockedProducts.upsertBatch).toHaveBeenCalledWith([
        {
          barcode: '779-1',
          name: 'Prod 779-1',
          brand: 'Marca',
          price: 100.5,
        },
        {
          barcode: '779-2',
          name: 'Prod 779-2',
          brand: 'Marca',
          price: 100.5,
        },
      ]);
    });

    it('descarta entradas sin id antes de upsertear', async () => {
      const productos = [apiProduct('ok'), { nombre: 'sin id', marca: 'X' } as never];

      const count = await syncService.ingestProductsBatch(productos);

      expect(count).toBe(1);
      expect(mockedProducts.upsertBatch).toHaveBeenCalledWith([
        expect.objectContaining({ barcode: 'ok' }),
      ]);
    });

    it('mapProduct: sin precioMax usa precio como price', async () => {
      const productos = [{ id: 'p-1', nombre: 'Prod', marca: 'Marca', precio: '50.5' }];

      await syncService.ingestProductsBatch(productos);

      expect(mockedProducts.upsertBatch).toHaveBeenCalledWith([
        expect.objectContaining({ barcode: 'p-1', price: 50.5 }),
      ]);
    });

    it('mapProduct: sin precioMax ni precio price cae a 0', async () => {
      const productos = [{ id: 'p-1', nombre: 'Prod', marca: 'Marca' }];

      await syncService.ingestProductsBatch(productos);

      expect(mockedProducts.upsertBatch).toHaveBeenCalledWith([
        expect.objectContaining({ barcode: 'p-1', price: 0 }),
      ]);
    });

    it('mapProduct: no incluye image_url', async () => {
      const productos = [{ id: 'p-1', nombre: 'Prod', marca: 'Marca', precioMax: '10' }];

      await syncService.ingestProductsBatch(productos);

      const calledWith = mockedProducts.upsertBatch.mock.calls[0][0];
      expect(calledWith[0]).not.toHaveProperty('image_url');
    });
  });
});
