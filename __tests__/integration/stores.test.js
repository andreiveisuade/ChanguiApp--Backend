'use strict';

const request = require('supertest');

jest.mock('../../src/repositories/store.repository');
jest.mock('../../src/middleware/auth', () => (req, res, next) => next());

const app = require('../../src/index');
const storeRepository = require('../../src/repositories/store.repository');

const stores = [
  { id: '1', name: 'Coto CABA', chain: 'Coto', address: 'Av. Corrientes 1234', lat: -34.6037, lng: -58.3816 },
  { id: '2', name: 'Carrefour Palermo', chain: 'Carrefour', address: 'Av. Santa Fe 3253', lat: -34.5875, lng: -58.4139 },
  { id: '3', name: 'Dia Belgrano', chain: 'Dia', address: 'Av. Cabildo 2000', lat: -34.5614, lng: -58.4552 },
];

describe('GET /api/stores — autenticado', () => {
  beforeEach(() => jest.clearAllMocks());

  it('devuelve 200 con array de stores', async () => {
    storeRepository.findAll.mockResolvedValue(stores);

    const res = await request(app).get('/api/stores');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
  });

  it('con lat y lng devuelve 200 con distanceKm en cada objeto', async () => {
    storeRepository.findAll.mockResolvedValue(stores);

    const res = await request(app).get('/api/stores?lat=-34.6037&lng=-58.3816');

    expect(res.statusCode).toBe(200);
    res.body.forEach((store) => {
      expect(store).toHaveProperty('distanceKm');
      expect(typeof store.distanceKm).toBe('number');
    });
  });

  it('con lat inválido devuelve 400', async () => {
    const res = await request(app).get('/api/stores?lat=invalido&lng=-58.3816');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('con solo lat sin lng devuelve 400', async () => {
    const res = await request(app).get('/api/stores?lat=-34.6037');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/stores — sin autenticación', () => {
  it('sin header Authorization devuelve 401', async () => {
    let isolatedApp;
    jest.isolateModules(() => {
      jest.unmock('../../src/middleware/auth');
      jest.mock('../../src/repositories/store.repository', () => ({
        findAll: jest.fn().mockResolvedValue(stores),
      }));
      isolatedApp = require('../../src/index');
    });

    const res = await request(isolatedApp).get('/api/stores');

    expect(res.statusCode).toBe(401);
  });
});
