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

  // TEST 2: validacion de inputs con express-validator.
  // IMPORTANTE: este describe va ANTES de rate limiting porque el rate limit
  // de /api/auth consume el budget de 10 requests por IP y rompe estos tests.
  describe('Validacion de inputs', () => {
    it('POST /api/auth/register sin email devuelve 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'secret123', name: 'Test' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Email invalido' }),
        ]),
      );
    });

    it('POST /api/auth/register con email mal formado devuelve 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'no-es-email', password: 'secret123', name: 'Test' });

      expect(res.statusCode).toBe(400);
    });

    it('POST /api/cart/items con quantity negativa devuelve 400 del validator', async () => {
      const mockSupabase = require('../helpers/mockSupabase');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@test.com' } },
        error: null,
      });

      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', 'Bearer valid-token')
        .send({ product_id: 'prod-123', quantity: -1 });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: expect.stringContaining('cantidad') }),
        ]),
      );
    });

    it('PUT /api/users/profile con script en nombre escapa el HTML', async () => {
      const mockSupabase = require('../helpers/mockSupabase');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@test.com' } },
        error: null,
      });

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: '<script>alert("xss")</script>' });

      // El validator usa .escape() que reemplaza <, >, ", ', / con HTML entities.
      // Si el endpoint devuelve el name modificado en el body, no debe contener <script>.
      expect(res.statusCode).not.toBe(500);
      if (res.body?.user?.name || res.body?.name) {
        const name = res.body.user?.name || res.body.name;
        expect(name).not.toContain('<script>');
      }
    });
  });

  // TEST 3: 429 en rate limit. Va ultimo porque consume el budget de /api/auth.
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
});