export {};

const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validUser, validCart, validCartItem, validProduct, validCheckoutPreference } = require('../helpers/testData');

const authHeader = { Authorization: 'Bearer test-token' };

jest.mock('../../src/middleware/auth', () => {
  return (req: any, res: any, next: any) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    req.user = { id: 'user-uuid-1', email: 'test@test.com' };
    next();
  };
});

jest.mock('../../src/config/mercadopago', () => ({
  __esModule: true,
  preference: { create: jest.fn() },
  payment: { get: jest.fn() },
  getAccountTags: jest.fn(),
}));

const mercadopagoConfig = require('../../src/config/mercadopago');

describe('Checkout Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  beforeEach(() => {
    delete process.env.MP_REQUIRE_TEST_USER;
    mercadopagoConfig.getAccountTags.mockResolvedValue(['test_user']);
  });

  describe('POST /api/checkout', () => {
    it('con carrito activo devuelve 200 con preference_id e init_point', async () => {
      const cartWithItems = {
        ...validCart,
        items: [{ ...validCartItem, unit_price: validProduct.price, product: validProduct }],
      };
      mockSupabase.maybeSingle.mockResolvedValue({ data: cartWithItems, error: null });
      mercadopagoConfig.preference.create.mockResolvedValue({
        id: validCheckoutPreference.preference_id,
        init_point: validCheckoutPreference.init_point,
      });

      const res = await request(app)
        .post('/api/checkout')
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('preference_id');
      expect(res.body).toHaveProperty('init_point');
    });

    it('sin carrito activo devuelve 400', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const res = await request(app)
        .post('/api/checkout')
        .set(authHeader);

      expect(res.statusCode).toBe(400);
    });

    it('con carrito vacío devuelve 400', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: { ...validCart, items: [] }, error: null });

      const res = await request(app)
        .post('/api/checkout')
        .set(authHeader);

      expect(res.statusCode).toBe(400);
    });

    it('sin token devuelve 401', async () => {
      const res = await request(app).post('/api/checkout');

      expect(res.statusCode).toBe(401);
    });

    it('con credenciales que no son de prueba devuelve 503 (seguro anti-cobro real)', async () => {
      mercadopagoConfig.getAccountTags.mockResolvedValue([]); // cuenta real
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { ...validCart, items: [{ ...validCartItem, unit_price: validProduct.price, product: validProduct }] },
        error: null,
      });

      const res = await request(app).post('/api/checkout').set(authHeader);

      expect(res.statusCode).toBe(503);
      expect(mercadopagoConfig.preference.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/checkout/webhook', () => {
    it('con notificación válida de pago aprobado devuelve 200', async () => {
      mercadopagoConfig.payment.get.mockResolvedValue({
        id: 'MP-123456',
        status: 'approved',
        external_reference: validCart.id,
        transaction_amount: 3000,
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

  describe('GET /api/checkout/status', () => {
    it('devuelve el status de la compra asociada a la preferencia', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'purchase-uuid-1', payment_status: 'completed', mp_preference_id: 'pref-uuid-1' },
        error: null,
      });

      const res = await request(app)
        .get('/api/checkout/status')
        .query({ preference_id: 'pref-uuid-1' })
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ status: 'completed' });
    });

    it('devuelve not_found si todavía no hay compra para esa preferencia', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const res = await request(app)
        .get('/api/checkout/status')
        .query({ preference_id: 'pref-pendiente' })
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ status: 'not_found' });
    });

    it('sin preference_id devuelve 400', async () => {
      const res = await request(app).get('/api/checkout/status').set(authHeader);

      expect(res.statusCode).toBe(400);
    });

    it('sin token devuelve 401', async () => {
      const res = await request(app).get('/api/checkout/status').query({ preference_id: 'x' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/checkout/return', () => {
    it('redirige (302) al deep link constante de la app', async () => {
      const res = await request(app).get('/api/checkout/return');

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('changuiapp://checkout/return');
    });
  });
});
