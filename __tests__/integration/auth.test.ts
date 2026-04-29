export {};

const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validUser } = require('../helpers/testData');

describe('POST /api/auth/register', () => {
  afterEach(() => jest.clearAllMocks());

  it('con datos válidos devuelve 201 con session y user', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: { id: validUser.id, email: validUser.email },
        session: { access_token: 'test-token' },
      },
      error: null,
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: validUser.id, email: validUser.email, full_name: validUser.full_name },
      error: null,
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: validUser.email,
        password: validUser.password,
        name: validUser.full_name,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('session.access_token', 'test-token');
    expect(res.body.user.email).toBe(validUser.email);
  });

  it('con email duplicado devuelve 409', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: validUser.id, email: validUser.email },
      error: null,
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: validUser.email,
        password: validUser.password,
        name: validUser.full_name,
      });

    expect(res.statusCode).toBe(409);
  });

  it('sin body devuelve 400', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.statusCode).toBe(400);
  });

  it('sin email devuelve 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: validUser.password, name: validUser.full_name });
    expect(res.statusCode).toBe(400);
  });

  it('sin password devuelve 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: validUser.email, name: validUser.full_name });
    expect(res.statusCode).toBe(400);
  });

  it('sin name devuelve 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: validUser.email, password: validUser.password });
    expect(res.statusCode).toBe(400);
  });

  it('con email malformado (sin @) devuelve 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'sin-arroba', password: validUser.password, name: validUser.full_name });
    expect(res.statusCode).toBe(400);
  });

  it('con password muy corta (<6 chars) devuelve 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: validUser.email, password: '12', name: validUser.full_name });
    expect(res.statusCode).toBe(400);
  });
});
