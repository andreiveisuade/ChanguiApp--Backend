'use strict';

const storeRepository = require('../../../src/repositories/store.repository');
const storeService = require('../../../src/services/store.service');

jest.mock('../../../src/repositories/store.repository');

const stores = [
  { id: '1', name: 'Coto CABA', chain: 'Coto', address: 'Av. Corrientes 1234', lat: -34.6037, lng: -58.3816 },
  { id: '2', name: 'Carrefour Palermo', chain: 'Carrefour', address: 'Av. Santa Fe 3253', lat: -34.5875, lng: -58.4139 },
  { id: '3', name: 'Dia Belgrano', chain: 'Dia', address: 'Av. Cabildo 2000', lat: -34.5614, lng: -58.4552 },
];

describe('StoreService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('list() sin argumentos', () => {
    it('retorna los stores ordenados alfabéticamente por nombre', async () => {
      storeRepository.findAll.mockResolvedValue(stores);

      const result = await storeService.list();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Carrefour Palermo');
      expect(result[1].name).toBe('Coto CABA');
      expect(result[2].name).toBe('Dia Belgrano');
    });

    it('retorna array vacío si el repository devuelve []', async () => {
      storeRepository.findAll.mockResolvedValue([]);

      const result = await storeService.list();

      expect(result).toEqual([]);
    });
  });

  describe('list(lat, lng) con coordenadas', () => {
    it('incluye el campo distanceKm (number) en cada store', async () => {
      storeRepository.findAll.mockResolvedValue(stores);

      const result = await storeService.list(-34.6037, -58.3816);

      result.forEach((store) => {
        expect(store).toHaveProperty('distanceKm');
        expect(typeof store.distanceKm).toBe('number');
      });
    });

    it('ordena los resultados por distanceKm ascendente', async () => {
      storeRepository.findAll.mockResolvedValue(stores);

      const result = await storeService.list(-34.6037, -58.3816);

      for (let i = 1; i < result.length; i++) {
        expect(result[i].distanceKm).toBeGreaterThanOrEqual(result[i - 1].distanceKm);
      }
    });
  });
});
