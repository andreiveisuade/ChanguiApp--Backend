const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validProduct, validUser } = require('../helpers/testData');

const authHeader = { Authorization: 'Bearer test-token' };

jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  req.user = { id: 'user-uuid-1', email: 'test@test.com' };
  next();
});

describe('Products Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /api/products/barcode/:code', () => {
    it('con barcode válido devuelve 200 con datos del producto', async () => {
      mockSupabase.single.mockResolvedValue({ data: validProduct, error: null });

      const res = await request(app)
        .get(`/api/products/barcode/${validProduct.barcode}`)
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.barcode).toBe(validProduct.barcode);
      expect(res.body.price).toBe(1500);
    });

    it('con barcode inexistente devuelve 404', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

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
});
