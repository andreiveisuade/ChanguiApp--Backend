export {};

const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validProduct, validUser } = require('../helpers/testData');

const authHeader = { Authorization: 'Bearer test-token' };

jest.mock('../../src/middleware/auth', () => {
  return (req: any, res: any, next: any) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    req.user = { id: 'user-uuid-1', email: 'test@test.com' };
    next();
  };
});

describe('Products Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /api/products/barcode/:code', () => {
    it('con barcode válido devuelve 200 con datos del producto', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: validProduct, error: null });

      const res = await request(app)
        .get(`/api/products/barcode/${validProduct.barcode}`)
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.barcode).toBe(validProduct.barcode);
      expect(res.body.price).toBe(1500);
    });

    it('con barcode inexistente devuelve 404', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const res = await request(app)
        .get('/api/products/barcode/0000000000000')
        .set(authHeader);

      expect(res.statusCode).toBe(404);
    });

    it('sin token devuelve 401', async () => {
      const res = await request(app)
        .get(`/api/products/barcode/${validProduct.barcode}`);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/products (catálogo incremental)', () => {
    const row = {
      id: 'p1', barcode: '111', name: 'A', brand: 'X',
      price: 121, image_url: null, updated_at: '2026-06-08T10:00:00.000Z',
      tax_category: [{ name: 'General', rate: 21 }],
    };

    it('devuelve la página del catálogo con cursor e IVA desglosado', async () => {
      mockSupabase.range.mockResolvedValue({ data: [row], error: null });

      const res = await request(app)
        .get('/api/products?updated_since=2026-06-01T00:00:00Z&limit=10&offset=0')
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.has_more).toBe(false);
      expect(res.body.next_cursor).toBe('2026-06-08T10:00:00.000Z');
      expect(res.body.products[0].barcode).toBe('111');
      expect(res.body.products[0].tax).toEqual({
        category: 'General', rate: 21, net_price: 100, tax_amount: 21,
      });
    });

    it('updated_since inválido devuelve 400', async () => {
      const res = await request(app)
        .get('/api/products?updated_since=no-es-fecha')
        .set(authHeader);

      expect(res.statusCode).toBe(400);
    });

    it('sin token devuelve 401', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(401);
    });
  });
});
