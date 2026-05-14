export {};

const request = require('supertest');

// Setear ADMIN_TOKEN ANTES de cargar la app
process.env.ADMIN_TOKEN = 'test-admin-token-secret';

const app = require('../../src/index');

jest.mock('../../src/services/sync.service');
const syncService = require('../../src/services/sync.service');

describe('POST /api/admin/sync-precios-claros', () => {
  afterEach(() => jest.clearAllMocks());

  it('sin header x-admin-token devuelve 401', async () => {
    const res = await request(app).post('/api/admin/sync-precios-claros');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('con x-admin-token incorrecto devuelve 401', async () => {
    const res = await request(app)
      .post('/api/admin/sync-precios-claros')
      .set('x-admin-token', 'token-equivocado');
    expect(res.statusCode).toBe(401);
  });

  it('con token correcto devuelve 200 y stats del sync', async () => {
    syncService.syncPreciosClaros.mockResolvedValue({
      created: 10,
      updated: 5,
      errors: 0,
      duration_ms: 1234,
    });

    const res = await request(app)
      .post('/api/admin/sync-precios-claros')
      .set('x-admin-token', 'test-admin-token-secret');

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      created: 10,
      updated: 5,
      errors: 0,
      duration_ms: 1234,
    });
    expect(syncService.syncPreciosClaros).toHaveBeenCalled();
  });

  it('si sync falla con excepcion devuelve 500', async () => {
    syncService.syncPreciosClaros.mockRejectedValue(new Error('SEPA API down'));

    const res = await request(app)
      .post('/api/admin/sync-precios-claros')
      .set('x-admin-token', 'test-admin-token-secret');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Sync failed');
  });
});
