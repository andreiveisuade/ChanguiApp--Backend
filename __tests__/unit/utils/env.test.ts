import { getEnvInt, getEnvString } from '../../../src/utils/env';

describe('utils/env', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe('getEnvInt', () => {
    it('parsea un entero válido de la variable', () => {
      process.env.TEST_INT = '42';
      expect(getEnvInt('TEST_INT', 7)).toBe(42);
    });

    it('usa el fallback si la variable no existe', () => {
      delete process.env.TEST_INT;
      expect(getEnvInt('TEST_INT', 7)).toBe(7);
    });

    it('usa el fallback si la variable no es un entero válido', () => {
      process.env.TEST_INT = 'abc';
      expect(getEnvInt('TEST_INT', 7)).toBe(7);
    });

    it('usa el fallback ante valores negativos', () => {
      process.env.TEST_INT = '-3';
      expect(getEnvInt('TEST_INT', 7)).toBe(7);
    });
  });

  describe('getEnvString', () => {
    it('devuelve el valor de la variable cuando existe', () => {
      process.env.TEST_STR = 'hola';
      expect(getEnvString('TEST_STR')).toBe('hola');
    });

    it('devuelve undefined sin fallback cuando la variable no existe', () => {
      delete process.env.TEST_STR;
      expect(getEnvString('TEST_STR')).toBeUndefined();
    });

    it('cae al fallback cuando la variable no existe', () => {
      delete process.env.TEST_STR;
      expect(getEnvString('TEST_STR', 'default')).toBe('default');
    });

    it('cae al fallback cuando la variable está vacía', () => {
      process.env.TEST_STR = '';
      expect(getEnvString('TEST_STR', 'default')).toBe('default');
    });

    it('relee process.env en cada llamada (no se congela al importar)', () => {
      delete process.env.TEST_STR;
      expect(getEnvString('TEST_STR')).toBeUndefined();
      process.env.TEST_STR = 'nuevo';
      expect(getEnvString('TEST_STR')).toBe('nuevo');
    });
  });
});
