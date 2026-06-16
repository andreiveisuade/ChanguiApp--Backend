export {};

const request = require('supertest');
const crypto = require('node:crypto');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const {
  validCart,
  validCartItem,
  validProduct,
  validCheckoutPreference,
} = require('../helpers/testData');

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
  mercadopagoGateway: {
    getAccountTags: jest.fn(),
    createPreference: jest.fn(),
    getPayment: jest.fn(),
  },
}));

const mercadopagoConfig = require('../../src/config/mercadopago');
const gateway = mercadopagoConfig.mercadopagoGateway;

describe('Checkout Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  beforeEach(() => {
    delete process.env.MP_REQUIRE_TEST_USER;
    gateway.getAccountTags.mockResolvedValue(['test_user']);
  });

  describe('POST /api/checkout', () => {
    it('con carrito activo devuelve 200 con preference_id e init_point', async () => {
      const cartWithItems = {
        ...validCart,
        items: [{ ...validCartItem, unit_price: validProduct.price, product: validProduct }],
      };
      mockSupabase.maybeSingle.mockResolvedValue({ data: cartWithItems, error: null });
      gateway.createPreference.mockResolvedValue({
        id: validCheckoutPreference.preference_id,
        init_point: validCheckoutPreference.init_point,
      });

      const res = await request(app).post('/api/checkout').set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('preference_id');
      expect(res.body).toHaveProperty('init_point');
    });

    it('sin carrito activo devuelve 400', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const res = await request(app).post('/api/checkout').set(authHeader);

      expect(res.statusCode).toBe(400);
    });

    it('con carrito vacío devuelve 400', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: { ...validCart, items: [] },
        error: null,
      });

      const res = await request(app).post('/api/checkout').set(authHeader);

      expect(res.statusCode).toBe(400);
    });

    it('sin token devuelve 401', async () => {
      const res = await request(app).post('/api/checkout');

      expect(res.statusCode).toBe(401);
    });

    it('con credenciales que no son de prueba devuelve 503 (seguro anti-cobro real)', async () => {
      gateway.getAccountTags.mockResolvedValue([]); // cuenta real
      mockSupabase.maybeSingle.mockResolvedValue({
        data: {
          ...validCart,
          items: [{ ...validCartItem, unit_price: validProduct.price, product: validProduct }],
        },
        error: null,
      });

      const res = await request(app).post('/api/checkout').set(authHeader);

      expect(res.statusCode).toBe(503);
      expect(gateway.createPreference).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/checkout/webhook', () => {
    it('con notificación válida de pago aprobado devuelve 200', async () => {
      gateway.getPayment.mockResolvedValue({
        id: 'MP-123456',
        status: 'approved',
        external_reference: validCart.id,
        transaction_amount: 3000,
      });
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            ...validCart,
            items: [{ ...validCartItem, unit_price: validProduct.price, product: validProduct }],
          },
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

  describe('POST /api/checkout/webhook — verificación de firma MP', () => {
    const SECRET = 'test-webhook-secret';
    const DATA_ID = 'mp-123456';
    const REQUEST_ID = 'req-abc';
    const TS = '1704908010';

    const signFor = (dataId: string, requestId: string, ts: string, secret = SECRET) => {
      const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
      const v1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
      return `ts=${ts},v1=${v1}`;
    };

    beforeEach(() => {
      process.env.MP_WEBHOOK_SECRET = SECRET;
    });
    afterEach(() => {
      delete process.env.MP_WEBHOOK_SECRET;
    });

    it('con firma válida procesa y devuelve 200', async () => {
      gateway.getPayment.mockResolvedValue(null); // corta temprano en handleWebhook
      const res = await request(app)
        .post('/api/checkout/webhook')
        .query({ 'data.id': DATA_ID })
        .set('x-signature', signFor(DATA_ID, REQUEST_ID, TS))
        .set('x-request-id', REQUEST_ID)
        .send({ type: 'payment', data: { id: DATA_ID } });

      expect(res.statusCode).toBe(200);
      expect(gateway.getPayment).toHaveBeenCalled();
    });

    it('con firma inválida devuelve 401 y no procesa', async () => {
      const res = await request(app)
        .post('/api/checkout/webhook')
        .query({ 'data.id': DATA_ID })
        .set('x-signature', `ts=${TS},v1=deadbeef`)
        .set('x-request-id', REQUEST_ID)
        .send({ type: 'payment', data: { id: DATA_ID } });

      expect(res.statusCode).toBe(401);
      expect(gateway.getPayment).not.toHaveBeenCalled();
    });

    it('sin header x-signature devuelve 401 y no procesa', async () => {
      const res = await request(app)
        .post('/api/checkout/webhook')
        .query({ 'data.id': DATA_ID })
        .send({ type: 'payment', data: { id: DATA_ID } });

      expect(res.statusCode).toBe(401);
      expect(gateway.getPayment).not.toHaveBeenCalled();
    });

    it('sin MP_WEBHOOK_SECRET (dev) bypassa la firma y devuelve 200', async () => {
      delete process.env.MP_WEBHOOK_SECRET;
      gateway.getPayment.mockResolvedValue(null);
      const res = await request(app)
        .post('/api/checkout/webhook')
        .send({ type: 'payment', data: { id: DATA_ID } });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/checkout/status', () => {
    it('devuelve el status de la compra asociada a la preferencia', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: {
          id: 'purchase-uuid-1',
          payment_status: 'completed',
          mp_preference_id: 'pref-uuid-1',
        },
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
