const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validUser } = require('../helpers/testData');

const userProfile = {
  id: validUser.id,
  email: validUser.email,
  name: 'Test User',
};

describe('GET /api/users/profile', () => {
  it('autenticado devuelve 200 con datos del usuario', async () => {
    mockSupabase.single.mockResolvedValue({
      data: userProfile,
      error: null,
    });

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
    const updated = { ...userProfile, name: 'Nuevo Nombre' };
    mockSupabase.single.mockResolvedValue({
      data: updated,
      error: null,
    });

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Nuevo Nombre' });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Nuevo Nombre');
  });

  it('sin token devuelve 401', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .send({ name: 'Nuevo Nombre' });

    expect(res.statusCode).toBe(401);
  });
});

describe('DELETE /api/users/profile', () => {
  it('autenticado devuelve 200', async () => {
    mockSupabase.single.mockResolvedValue({
      data: userProfile,
      error: null,
    });

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
