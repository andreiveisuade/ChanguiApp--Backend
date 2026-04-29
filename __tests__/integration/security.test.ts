export {};

const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

describe('Security', () => {
  afterEach(() => jest.clearAllMocks());

  // TEST 1: 401 sin token
  describe('Rutas protegidas sin token', () => {
    it('GET /api/users/profile sin token devuelve 401', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.statusCode).toBe(401);
    });

    it('GET /api/cart sin token devuelve 401', async () => {
      const res = await request(app).get('/api/cart');
      expect(res.statusCode).toBe(401);
    });
  });

  // TEST 2: 429 en rate limit
  describe('Rate limiting', () => {
    it('mas de 10 requests a /api/auth devuelve 429', async () => {
      const requests = Array.from({ length: 11 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'wrong' })
      );

      const responses = await Promise.all(requests);
      const tooMany = responses.some((res) => res.statusCode === 429);
      expect(tooMany).toBe(true);
    });
  });

  // Tests de sanitizacion pendientes hasta que validators.ts este implementado
});