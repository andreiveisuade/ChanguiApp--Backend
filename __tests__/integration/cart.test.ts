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
import { validCart, validCartItem, validProduct } from '../helpers/testData';

const authHeader = { Authorization: 'Bearer test-token' };

describe('Cart Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /api/cart', () => {
    it('autenticado con carrito activo devuelve 200 con cart, items y total', async () => {
      const cartWithItems = {
        ...validCart,
        items: [{ ...validCartItem, unit_price: validProduct.price }],
      };
      mockSupabase.maybeSingle.mockResolvedValue({ data: cartWithItems, error: null });

      const res = await request(app).get('/api/cart').set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.cart.id).toBe(validCart.id);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.total).toBeGreaterThanOrEqual(0);
    });

    it('sin carrito activo devuelve 200 con cart null e items vacío', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const res = await request(app).get('/api/cart').set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.cart).toBeNull();
      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it('sin token devuelve 401', async () => {
      const res = await request(app).get('/api/cart');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/cart/items', () => {
    it('con product_id y unit_price devuelve 201 con item creado', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: validCart, error: null });
      mockSupabase.single.mockResolvedValue({ data: validCartItem, error: null });

      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader)
        .send({ product_id: validProduct.id, unit_price: validProduct.price, quantity: 2 });

      expect(res.statusCode).toBe(201);
      expect(res.body.product_id).toBe(validCartItem.product_id);
    });

    it('sin product_id devuelve 400', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader)
        .send({ unit_price: 100, quantity: 2 });

      expect(res.statusCode).toBe(400);
    });

    it('sin unit_price devuelve 400', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader)
        .send({ product_id: validProduct.id, quantity: 2 });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/cart/items/:id', () => {
    it('con nueva quantity devuelve 200 con item actualizado', async () => {
      const updated = { ...validCartItem, quantity: 5 };
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: validCartItem, error: null })  // findItemById
        .mockResolvedValueOnce({ data: validCart, error: null });      // findActiveCartByUserId
      mockSupabase.single.mockResolvedValue({ data: updated, error: null });

      const res = await request(app)
        .put(`/api/cart/items/${validCartItem.id}`)
        .set(authHeader)
        .send({ quantity: 5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.quantity).toBe(5);
    });

    it('item inexistente devuelve 404', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const res = await request(app)
        .put('/api/cart/items/item-inexistente')
        .set(authHeader)
        .send({ quantity: 3 });

      expect(res.statusCode).toBe(404);
    });

    it('sin quantity devuelve 400', async () => {
      const res = await request(app)
        .put(`/api/cart/items/${validCartItem.id}`)
        .set(authHeader)
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/cart/items/:id', () => {
    it('elimina item y devuelve 200 con el item eliminado', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: validCartItem, error: null })  // findItemById
        .mockResolvedValueOnce({ data: validCart, error: null });      // findActiveCartByUserId
      mockSupabase.single.mockResolvedValue({ data: validCartItem, error: null });

      const res = await request(app)
        .delete(`/api/cart/items/${validCartItem.id}`)
        .set(authHeader);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/cart', () => {
    it('cancela el carrito activo y devuelve 200 con status cancelled', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: validCart, error: null });
      mockSupabase.single.mockResolvedValue({ data: { ...validCart, status: 'cancelled' }, error: null });

      const res = await request(app).delete('/api/cart').set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });

    it('sin carrito activo devuelve 404', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const res = await request(app).delete('/api/cart').set(authHeader);

      expect(res.statusCode).toBe(404);
    });
  });
});
