export {};

const request = require('supertest');
const app = require('../../src/index');

jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validStore, validUser } = require('../helpers/testData');

const authHeader = { Authorization: 'Bearer test-token' };

jest.mock('../../src/middleware/auth', () => {
  return (req: any, res: any, next: any) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    req.user = { id: 'user-uuid-1', email: 'test@test.com' };
    next();
  };
});

describe('Stores Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /api/stores', () => {
    it('autenticado devuelve 200 con lista de stores', async () => {
      mockSupabase.select.mockResolvedValue({ data: [validStore], error: null });

      const res = await request(app)
        .get('/api/stores')
        .set(authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Carrefour Express');
    });

    it('sin token devuelve 401', async () => {
      const res = await request(app).get('/api/stores');

      expect(res.statusCode).toBe(401);
    });
  });
});
