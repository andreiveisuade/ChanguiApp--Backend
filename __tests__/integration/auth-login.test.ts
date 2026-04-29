export {};

const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validUser } = require('../helpers/testData');

describe('POST /api/auth/login + rutas protegidas', () => {
  afterEach(() => jest.clearAllMocks());

  describe('POST /api/auth/login', () => {
    it('con credenciales válidas devuelve 200 con session y user', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: validUser.id, email: validUser.email },
          session: { access_token: 'test-token' },
        },
        error: null,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('session.access_token', 'test-token');
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('con credenciales inválidas devuelve 401', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrong' });

      expect(res.statusCode).toBe(401);
    });

    it('sin campos obligatorios devuelve 400', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect(res.statusCode).toBe(400);
    });

    it('sin email devuelve 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: validUser.password });
      expect(res.statusCode).toBe(400);
    });

    it('sin password devuelve 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email });
      expect(res.statusCode).toBe(400);
    });

    it('con email malformado devuelve 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'no-arroba', password: validUser.password });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Rutas protegidas — middleware auth', () => {
    it('GET /api/users/profile sin Authorization header devuelve 401', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.statusCode).toBe(401);
    });

    it('GET /api/users/profile con header malformado (sin Bearer) devuelve 401', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Basic abc123');
      expect(res.statusCode).toBe(401);
    });

    it('GET /api/users/profile con token inválido devuelve 401', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
    });
  });
});
