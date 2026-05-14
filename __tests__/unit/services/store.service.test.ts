export {};

const storeService = require('../../../src/services/store.service');
const storeRepository = require('../../../src/repositories/store.repository');

jest.mock('../../../src/repositories/store.repository');

const { validStore } = require('../../helpers/testData');

describe('StoreService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('devuelve lista de stores', async () => {
      storeRepository.findAll.mockResolvedValue([validStore]);

      const result = await storeService.list();

      expect(storeRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Carrefour Express');
    });

    it('devuelve array vacío si no hay stores', async () => {
      storeRepository.findAll.mockResolvedValue([]);

      const result = await storeService.list();

      expect(result).toEqual([]);
    });

    it('propaga error de DB del repository', async () => {
      storeRepository.findAll.mockRejectedValue(new Error('DB connection lost'));

      await expect(storeService.list()).rejects.toThrow('DB connection lost');
    });
  });
});
