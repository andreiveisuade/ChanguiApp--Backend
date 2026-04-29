export {};

const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validUser } = require('../helpers/testData');

describe('Auth Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  describe('POST /api/auth/register', () => {
    it('con datos válidos devuelve 201 con token y datos del usuario', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: validUser.id, email: validUser.email },
          session: { access_token: 'test-token' },
        },
        error: null,
      });
      mockSupabase.single.mockResolvedValue({
        data: { id: validUser.id, email: validUser.email },
        error: null,
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('con email duplicado devuelve 409', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', status: 422 },
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.statusCode).toBe(409);
    });

    it('sin campos obligatorios devuelve 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('con credenciales válidas devuelve 200 con token y datos', async () => {
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
      expect(res.body).toHaveProperty('token');
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
  });

  describe('Rutas protegidas', () => {
    it('sin token devuelve 401', async () => {
      const res = await request(app).get('/api/users/profile');

      expect(res.statusCode).toBe(401);
    });

    it('con token inválido devuelve 401', async () => {
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
