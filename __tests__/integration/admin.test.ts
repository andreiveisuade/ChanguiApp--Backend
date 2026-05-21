export {};

const request = require('supertest');

process.env.ADMIN_TOKEN = 'test-admin-token-secret';

jest.mock('../../src/services/sync.service');
jest.mock('../../src/repositories/sync_jobs.repository');

const app = require('../../src/index');
const syncService = require('../../src/services/sync.service');
const syncJobsRepository = require('../../src/repositories/sync_jobs.repository');
const { ApiError } = require('../../src/types/domain');

describe('admin sync endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  describe('POST /api/admin/sync-precios-claros', () => {
    it('sin header x-admin-token devuelve 401', async () => {
      const res = await request(app).post('/api/admin/sync-precios-claros');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Token de administrador inválido');
    });

    it('con x-admin-token incorrecto devuelve 401', async () => {
      const res = await request(app)
        .post('/api/admin/sync-precios-claros')
        .set('x-admin-token', 'token-equivocado');
      expect(res.statusCode).toBe(401);
    });

    it('con token correcto devuelve 202 + sync_id', async () => {
      syncService.startPreciosClarosSync.mockResolvedValue({ sync_id: 'job-uuid-1' });

      const res = await request(app)
        .post('/api/admin/sync-precios-claros')
        .set('x-admin-token', 'test-admin-token-secret');

      expect(res.statusCode).toBe(202);
      expect(res.body).toEqual({ sync_id: 'job-uuid-1' });
      expect(syncService.startPreciosClarosSync).toHaveBeenCalled();
    });

    it('si ya hay un sync running devuelve 409', async () => {
      syncService.startPreciosClarosSync.mockRejectedValue(
        new ApiError('Ya hay un sync en curso', 409),
      );
      jest.spyOn(console, 'error').mockImplementation();

      const res = await request(app)
        .post('/api/admin/sync-precios-claros')
        .set('x-admin-token', 'test-admin-token-secret');

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe('Ya hay un sync en curso');
    });

    it('si el service tira un error inesperado devuelve 500', async () => {
      syncService.startPreciosClarosSync.mockRejectedValue(new Error('DB down'));
      jest.spyOn(console, 'error').mockImplementation();

      const res = await request(app)
        .post('/api/admin/sync-precios-claros')
        .set('x-admin-token', 'test-admin-token-secret');

      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/admin/sync-precios-claros/:id', () => {
    it('sin header x-admin-token devuelve 401', async () => {
      const res = await request(app).get('/api/admin/sync-precios-claros/some-id');
      expect(res.statusCode).toBe(401);
    });

    it('con token correcto y job existente devuelve 200 + job', async () => {
      const job = {
        id: 'job-uuid-1',
        type: 'precios_claros',
        status: 'running',
        total_target: 8021,
        processed: 200,
        errors: 0,
        last_offset: 200,
        error_message: null,
        started_at: '2026-05-21T00:00:00Z',
        completed_at: null,
        created_at: '2026-05-21T00:00:00Z',
      };
      syncJobsRepository.findById.mockResolvedValue(job);

      const res = await request(app)
        .get('/api/admin/sync-precios-claros/job-uuid-1')
        .set('x-admin-token', 'test-admin-token-secret');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(job);
      expect(syncJobsRepository.findById).toHaveBeenCalledWith('job-uuid-1');
    });

    it('con token correcto y job inexistente devuelve 404', async () => {
      syncJobsRepository.findById.mockResolvedValue(null);
      jest.spyOn(console, 'error').mockImplementation();

      const res = await request(app)
        .get('/api/admin/sync-precios-claros/no-existe')
        .set('x-admin-token', 'test-admin-token-secret');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Sync no encontrado');
    });
  });
});
