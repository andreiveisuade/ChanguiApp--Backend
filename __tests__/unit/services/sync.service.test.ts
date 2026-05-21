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

describe('SyncService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      PRECIOS_CLAROS_URL: 'https://test.preciosclaros.gob.ar',
      MVP_STORE_PRECIOS_CLAROS_ID: 'store-42',
      SYNC_DELAY_MS: '0',
    };
    mockedJobs.findRunning.mockResolvedValue(null);
    mockedJobs.create.mockResolvedValue(buildJob());
    mockedJobs.setTotal.mockResolvedValue(undefined);
    mockedJobs.updateProgress.mockResolvedValue(undefined);
    mockedJobs.markCompleted.mockResolvedValue(undefined);
    mockedJobs.markFailed.mockResolvedValue(undefined);
    mockedProducts.upsertBatch.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('startPreciosClarosSync', () => {
    it('crea job y devuelve sync_id cuando no hay running', async () => {
      const result = await syncService.startPreciosClarosSync();

      expect(mockedJobs.findRunning).toHaveBeenCalledWith('precios_claros');
      expect(mockedJobs.create).toHaveBeenCalledWith('precios_claros');
      expect(result).toEqual({ sync_id: JOB_ID });
    });

    it('lanza ApiError 409 si ya hay un sync running', async () => {
      mockedJobs.findRunning.mockResolvedValue(buildJob());

      await expect(syncService.startPreciosClarosSync()).rejects.toMatchObject({
        status: 409,
        message: 'Ya hay un sync en curso',
      });
      expect(mockedJobs.create).not.toHaveBeenCalled();
    });

    it('dispara el runner en background (side-effect: el runner llega a setTotal)', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(fetchResponse({ total: 0, productos: [] }));

      await syncService.startPreciosClarosSync();
      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setImmediate(r));

      expect(mockedJobs.setTotal).toHaveBeenCalledWith(JOB_ID, 0);
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
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

      const fetchSpy = jest
        .spyOn(global, 'fetch')
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
      expect(mockedProducts.upsertBatch).toHaveBeenNthCalledWith(1, expect.arrayContaining([
        expect.objectContaining({ barcode: 'p-0', name: 'Prod p-0', price: 100.5 }),
      ]));

      expect(mockedJobs.updateProgress).toHaveBeenLastCalledWith(JOB_ID, 102, 102, 0);
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
      expect(mockedJobs.markFailed).not.toHaveBeenCalled();
    });

    it('total=0: no fetchea productos y marca completed', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(fetchResponse({ total: 0, productos: [] }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.setTotal).toHaveBeenCalledWith(JOB_ID, 0);
      expect(mockedProducts.upsertBatch).not.toHaveBeenCalled();
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
    });

    it('cuando upsertBatch falla, suma a errors y sigue (no aborta)', async () => {
      const page = [apiProduct('p-1'), apiProduct('p-2')];

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(fetchResponse({ total: 2, productos: [apiProduct('head')] }))
        .mockResolvedValueOnce(fetchResponse({ total: 2, productos: page }));

      mockedProducts.upsertBatch.mockRejectedValueOnce(new Error('DB down'));
      jest.spyOn(console, 'error').mockImplementation();

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.updateProgress).toHaveBeenLastCalledWith(JOB_ID, 0, 2, 2);
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
    });

    it('marca failed si el primer fetch tira', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('SEPA down'));
      jest.spyOn(console, 'error').mockImplementation();

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.markFailed).toHaveBeenCalledWith(JOB_ID, 'SEPA down');
      expect(mockedJobs.markCompleted).not.toHaveBeenCalled();
    });

    it('para temprano si la página devuelve menos del PAGE_LIMIT', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(fetchResponse({ total: 500, productos: [apiProduct('head')] }))
        .mockResolvedValueOnce(fetchResponse({ total: 500, productos: [apiProduct('p-1')] }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
    });

    it('para si la página devuelve productos vacíos antes del total', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(fetchResponse({ total: 500, productos: [apiProduct('head')] }))
        .mockResolvedValueOnce(fetchResponse({ total: 500, productos: [] }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedProducts.upsertBatch).not.toHaveBeenCalled();
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
    });

    it('aplica delay configurable cuando SYNC_DELAY_MS > 0', async () => {
      process.env.SYNC_DELAY_MS = '5';
      const fullPage = Array.from({ length: 100 }, (_, i) => apiProduct(`p-${i}`));

      jest
        .spyOn(global, 'fetch')
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

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(fetchResponse({ total: 0, productos: [] }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
    });

    it('si total ausente en la respuesta, usa 0 y completa sin productos', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(fetchResponse({ productos: [] }));

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.setTotal).toHaveBeenCalledWith(JOB_ID, 0);
      expect(mockedJobs.markCompleted).toHaveBeenCalledWith(JOB_ID);
    });

    it('captura errores no-Error y los stringifica para markFailed', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue('string-error');
      jest.spyOn(console, 'error').mockImplementation();

      await syncService.runPreciosClarosSync(JOB_ID);

      expect(mockedJobs.markFailed).toHaveBeenCalledWith(JOB_ID, 'string-error');
    });
  });
});
