const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

jest.mock('../../src/middleware/auth', () => {
  return (req: any, res: any, next: any) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    req.user = { id: 'user-uuid-1', email: 'test@test.com' };
    next();
  };
});

const mockSupabase = require('../helpers/mockSupabase');
const { validUser } = require('../helpers/testData');

const userProfile = {
  id: validUser.id,
  email: validUser.email,
  full_name: 'Test User',
};

describe('GET /api/users/profile', () => {
  it('autenticado devuelve 200 con datos del usuario', async () => {
    mockSupabase.single.mockResolvedValue({ data: userProfile, error: null });

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer test-token');

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(validUser.id);
    expect(res.body.email).toBe(validUser.email);
  });

  it('sin token devuelve 401', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.statusCode).toBe(401);
  });
});

describe('PUT /api/users/profile', () => {
  it('con datos válidos devuelve 200 con perfil actualizado', async () => {
    const updated = { ...userProfile, full_name: 'Nuevo Nombre' };
    mockSupabase.single.mockResolvedValue({ data: updated, error: null });

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', 'Bearer test-token')
      .send({ full_name: 'Nuevo Nombre' });

    expect(res.statusCode).toBe(200);
    expect(res.body.full_name).toBe('Nuevo Nombre');
  });

  it('sin token devuelve 401', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .send({ full_name: 'Nuevo Nombre' });

    expect(res.statusCode).toBe(401);
  });
});

describe('DELETE /api/users/profile', () => {
  it('autenticado devuelve 200', async () => {
    mockSupabase.single.mockResolvedValue({ data: userProfile, error: null });

    const res = await request(app)
      .delete('/api/users/profile')
      .set('Authorization', 'Bearer test-token');

    expect(res.statusCode).toBe(200);
  });

  it('sin token devuelve 401', async () => {
    const res = await request(app).delete('/api/users/profile');
    expect(res.statusCode).toBe(401);
  });
});
