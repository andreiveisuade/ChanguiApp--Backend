import { fetchPage } from '../../../src/services/precios-claros.client';

function okResponse(body: unknown): Response {
  return { ok: true, json: async () => body } as unknown as Response;
}

function errorResponse(status: number): Response {
  return { ok: false, status, json: async () => ({}) } as unknown as Response;
}

// fetch es un binding nativo en Node 20+ (no spyable con jest.spyOn). Lo mockeamos
// por asignacion directa a global.fetch y restauramos el original en afterEach.
const realFetch = global.fetch;
function mockFetch(): jest.MockedFunction<typeof fetch> {
  const fn = jest.fn() as unknown as jest.MockedFunction<typeof fetch>;
  (global as { fetch: typeof fetch }).fetch = fn;
  return fn;
}

describe('preciosClarosClient.fetchPage', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // SYNC_RETRY_BASE_MS=0 => sin backoff entre reintentos (no esperamos en los tests).
    process.env = { ...originalEnv, SYNC_RETRY_BASE_MS: '0' };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
    jest.restoreAllMocks();
    (global as { fetch: typeof fetch }).fetch = realFetch;
  });

  it('devuelve el json en el primer intento exitoso', async () => {
    const body = { total: 3, productos: [{ id: 'p-1', nombre: 'X', marca: 'M' }] };
    const fetchSpy = mockFetch().mockResolvedValue(okResponse(body));

    const result = await fetchPage('https://test.preciosclaros.gob.ar', 'store-42', 100, 0);

    expect(result).toEqual(body);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('agota los reintentos con respuesta no-ok y rechaza con el HTTP status', async () => {
    process.env.SYNC_MAX_RETRIES = '2';
    const fetchSpy = mockFetch().mockResolvedValue(errorResponse(503));
    jest.spyOn(console, 'error').mockImplementation();

    await expect(
      fetchPage('https://test.preciosclaros.gob.ar', 'store-42', 100, 0),
    ).rejects.toThrow(/HTTP 503/);

    // 1 intento + 2 reintentos = 3 llamadas
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('rechaza con el error de fallback cuando todos los intentos lanzan no-Error', async () => {
    const fetchSpy = mockFetch();
    (fetchSpy as jest.Mock).mockRejectedValue('str');
    jest.spyOn(console, 'error').mockImplementation();

    await expect(
      fetchPage('https://test.preciosclaros.gob.ar', 'store-42', 100, 0),
    ).rejects.toThrow(/falló tras/);
  });
});
