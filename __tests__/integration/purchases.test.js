const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validUser, validPurchase, validPurchaseItem } = require('../helpers/testData');

const authHeader = { Authorization: 'Bearer test-token' };

jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  req.user = { id: 'user-uuid-1', email: 'test@test.com' };
  next();
});

describe('Purchases Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /api/purchases', () => {
    it('autenticado devuelve 200 con lista de compras', async () => {
      mockSupabase.order.mockResolvedValue({ data: [validPurchase], error: null });

      const res = await request(app)
        .get('/api/purchases')
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].total).toBe(3000);
    });

    it('sin compras devuelve 200 con array vacío', async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const res = await request(app)
        .get('/api/purchases')
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('sin token devuelve 401', async () => {
      const res = await request(app).get('/api/purchases');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/purchases/:id', () => {
    it('con id válido devuelve 200 con detalle e items', async () => {
      const purchaseWithItems = { ...validPurchase, items: [validPurchaseItem] };
      mockSupabase.single.mockResolvedValue({ data: purchaseWithItems, error: null });

      const res = await request(app)
        .get(`/api/purchases/${validPurchase.id}`)
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].product_name).toBe('Coca Cola 500ml');
    });

    it('con id inexistente devuelve 404', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const res = await request(app)
        .get('/api/purchases/inexistente')
        .set(authHeader);

      expect(res.statusCode).toBe(404);
    });

    it('sin token devuelve 401', async () => {
      const res = await request(app)
        .get(`/api/purchases/${validPurchase.id}`);

      expect(res.statusCode).toBe(401);
    });
  });
});
