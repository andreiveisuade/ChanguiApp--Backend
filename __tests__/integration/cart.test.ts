const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validCart, validCartItem, validProduct, validUser } = require('../helpers/testData');

const authHeader = { Authorization: 'Bearer test-token' };

// Mock del middleware de auth para inyectar user
jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  req.user = { id: validUser.id, email: validUser.email };
  next();
});

describe('Cart Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /api/cart', () => {
    it('autenticado devuelve 200 con items y total', async () => {
      const cartWithItems = {
        ...validCart,
        items: [{ ...validCartItem, unit_price: validProduct.price }],
      };
      mockSupabase.single.mockResolvedValue({ data: cartWithItems, error: null });

      const res = await request(app)
        .get('/api/cart')
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(validCart.id);
      expect(res.body.items).toHaveLength(1);
    });

    it('sin carrito activo devuelve 404', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const res = await request(app)
        .get('/api/cart')
        .set(authHeader);

      expect(res.statusCode).toBe(404);
    });

    it('sin token devuelve 401', async () => {
      const res = await request(app).get('/api/cart');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/cart/items', () => {
    it('con product_id y quantity devuelve 201 con item creado', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: validCart, error: null })
        .mockResolvedValueOnce({ data: validCartItem, error: null });

      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader)
        .send({ product_id: validProduct.id, quantity: 2 });

      expect(res.statusCode).toBe(201);
      expect(res.body.product_id).toBe(validProduct.id);
    });

    it('sin product_id devuelve 400', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader)
        .send({ quantity: 2 });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/cart/items/:id', () => {
    it('con nueva quantity devuelve 200', async () => {
      const updated = { ...validCartItem, quantity: 5 };
      mockSupabase.single.mockResolvedValue({ data: updated, error: null });

      const res = await request(app)
        .put(`/api/cart/items/${validCartItem.id}`)
        .set(authHeader)
        .send({ quantity: 5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.quantity).toBe(5);
    });

    it('item inexistente devuelve 404', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const res = await request(app)
        .put('/api/cart/items/item-inexistente')
        .set(authHeader)
        .send({ quantity: 3 });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/cart/items/:id', () => {
    it('elimina item y devuelve 200', async () => {
      mockSupabase.eq.mockResolvedValue({ error: null });

      const res = await request(app)
        .delete(`/api/cart/items/${validCartItem.id}`)
        .set(authHeader);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/cart', () => {
    it('cierra el carrito y devuelve 200', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: validCart, error: null })
        .mockResolvedValueOnce({ data: { ...validCart, status: 'cancelled' }, error: null });

      const res = await request(app)
        .delete('/api/cart')
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });
  });
});
