const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validUser, validCart, validCartItem, validProduct, validCheckoutPreference } = require('../helpers/testData');

const authHeader = { Authorization: 'Bearer test-token' };

jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  req.user = { id: validUser.id, email: validUser.email };
  next();
});

jest.mock('mercadopago', () => ({
  configure: jest.fn(),
  preferences: {
    create: jest.fn(),
  },
  payment: {
    findById: jest.fn(),
  },
}));

const mercadopago = require('mercadopago');

describe('Checkout Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  describe('POST /api/checkout', () => {
    it('con carrito activo devuelve 200 con preference_id e init_point', async () => {
      const cartWithItems = {
        ...validCart,
        items: [{ ...validCartItem, unit_price: validProduct.price, product: validProduct }],
      };
      mockSupabase.single.mockResolvedValue({ data: cartWithItems, error: null });
      mercadopago.preferences.create.mockResolvedValue({
        body: validCheckoutPreference,
      });

      const res = await request(app)
        .post('/api/checkout')
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('preference_id');
      expect(res.body).toHaveProperty('init_point');
    });

    it('sin carrito activo devuelve 400', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const res = await request(app)
        .post('/api/checkout')
        .set(authHeader);

      expect(res.statusCode).toBe(400);
    });

    it('con carrito vacío devuelve 400', async () => {
      mockSupabase.single.mockResolvedValue({ data: { ...validCart, items: [] }, error: null });

      const res = await request(app)
        .post('/api/checkout')
        .set(authHeader);

      expect(res.statusCode).toBe(400);
    });

    it('sin token devuelve 401', async () => {
      const res = await request(app).post('/api/checkout');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/checkout/webhook', () => {
    it('con notificación válida de pago aprobado devuelve 200', async () => {
      mercadopago.payment.findById.mockResolvedValue({
        body: {
          id: 'MP-123456',
          status: 'approved',
          external_reference: validCart.id,
          transaction_amount: 3000,
        },
      });
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { ...validCart, items: [{ ...validCartItem, unit_price: validProduct.price, product: validProduct }] },
          error: null,
        })
        .mockResolvedValueOnce({ data: { id: 'purchase-uuid-1' }, error: null })
        .mockResolvedValueOnce({ data: { ...validCart, status: 'completed' }, error: null });

      const res = await request(app)
        .post('/api/checkout/webhook')
        .send({ type: 'payment', data: { id: 'MP-123456' } });

      expect(res.statusCode).toBe(200);
    });
  });
});
