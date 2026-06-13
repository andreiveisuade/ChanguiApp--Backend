import request from 'supertest';
import app from '../../src/index';

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

// CRÍTICO: hardcodear 'user-uuid-1', NO referenciar validUser fuera de scope
jest.mock('../../src/middleware/auth', () => (req: any, res: any, next: any) => {
  if (!req.headers.authorization) return res.status(401).json({ error: 'Token requerido' });
  req.user = { id: 'user-uuid-1', email: 'test@test.com' };
  next();
});

import mockSupabase from '../helpers/mockSupabase';
import { validList, validListItem } from '../helpers/testData';

const authHeader = { Authorization: 'Bearer test-token' };

describe('Lists Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /api/lists', () => {
    it('sin token devuelve 401', async () => {
      const res = await request(app).get('/api/lists');
      expect(res.statusCode).toBe(401);
    });

    it('autenticado devuelve 200 con las listas', async () => {
      mockSupabase.order.mockResolvedValue({ data: [validList], error: null });
      const res = await request(app).get('/api/lists').set(authHeader);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(validList.id);
    });
  });

  describe('POST /api/lists', () => {
    it('crea una lista y devuelve 201', async () => {
      mockSupabase.single.mockResolvedValue({ data: validList, error: null });
      const res = await request(app).post('/api/lists').set(authHeader).send({ name: 'Compras' });
      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBe(validList.id);
    });
  });

  describe('GET /api/lists/:id', () => {
    it('devuelve 200 con la lista y sus items', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { ...validList, items: [validListItem] },
        error: null,
      });
      const res = await request(app).get(`/api/lists/${validList.id}`).set(authHeader);
      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
    });

    it('404 si la lista no existe o no es del usuario', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
      jest.spyOn(console, 'error').mockImplementation();
      const res = await request(app).get('/api/lists/no-existe').set(authHeader);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/lists/:id', () => {
    it('borra la lista y devuelve 200', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: validList, error: null });
      const res = await request(app).delete(`/api/lists/${validList.id}`).set(authHeader);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('404 si la lista no es del usuario', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
      jest.spyOn(console, 'error').mockImplementation();
      const res = await request(app).delete('/api/lists/no-existe').set(authHeader);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/lists/:id/items', () => {
    it('sin product_name devuelve 400', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      const res = await request(app)
        .post(`/api/lists/${validList.id}/items`)
        .set(authHeader)
        .send({ quantity: 2 });
      expect(res.statusCode).toBe(400);
    });

    it('agrega un item y devuelve 201', async () => {
      // ownership (maybeSingle) -> insert (single)
      mockSupabase.maybeSingle.mockResolvedValue({ data: validList, error: null });
      mockSupabase.single.mockResolvedValue({ data: validListItem, error: null });
      const res = await request(app)
        .post(`/api/lists/${validList.id}/items`)
        .set(authHeader)
        .send({ product_name: 'Leche', quantity: 2 });
      expect(res.statusCode).toBe(201);
      expect(res.body.product_name).toBe('Leche');
    });

    it('404 si la lista no es del usuario', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
      jest.spyOn(console, 'error').mockImplementation();
      const res = await request(app)
        .post('/api/lists/no-existe/items')
        .set(authHeader)
        .send({ product_name: 'Leche' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/lists/:id/items/:itemId', () => {
    it('actualiza el tachado y devuelve 200', async () => {
      // ownership (maybeSingle) -> update (maybeSingle)
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: validList, error: null })
        .mockResolvedValueOnce({ data: { ...validListItem, purchased: true }, error: null });
      const res = await request(app)
        .put(`/api/lists/${validList.id}/items/${validListItem.id}`)
        .set(authHeader)
        .send({ purchased: true });
      expect(res.statusCode).toBe(200);
      expect(res.body.purchased).toBe(true);
    });
  });

  describe('DELETE /api/lists/:id/items/:itemId', () => {
    it('borra el item y devuelve 200', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: validList, error: null })
        .mockResolvedValueOnce({ data: validListItem, error: null });
      const res = await request(app)
        .delete(`/api/lists/${validList.id}/items/${validListItem.id}`)
        .set(authHeader);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });
  });
});
