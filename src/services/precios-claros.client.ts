import { sleep } from '../utils/sleep';
import { getEnvInt } from '../utils/env';

// Cliente HTTP de Precios Claros (SEPA). Responsabilidad única: traer una página
// del catálogo con reintentos/timeout. La orquestación del sync vive en
// sync.service; este módulo no sabe nada de jobs ni de persistencia.

export interface PreciosClarosProduct {
  id: string;
  nombre: string;
  marca: string;
  precioMax?: string;
  precio?: string;
  imagen?: string;
}

export interface PreciosClarosResponse {
  total: number;
  productos: PreciosClarosProduct[];
}

const FETCH_TIMEOUT_MS = 30000;

// Precios Claros (CloudFront) rate-limitea y devuelve 403/429/5xx de forma
// intermitente. Sin reintentos, ~2 de cada 3 syncs bajaban 0 productos. El
// backoff exponencial (1s, 2s, 4s) recupera la mayoría de esos fallos.
export async function fetchPage(
  baseUrl: string,
  storeId: string,
  limit: number,
  offset: number,
): Promise<PreciosClarosResponse> {
  const url = `${baseUrl}/productos?string=&limit=${limit}&offset=${offset}&id_sucursal=${storeId}`;
  const maxRetries = getEnvInt('SYNC_MAX_RETRIES', 3);
  const backoffBase = getEnvInt('SYNC_RETRY_BASE_MS', 1000);

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await sleep(backoffBase * 2 ** (attempt - 1));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChanguiApp/1.0)' },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Precios Claros respondió HTTP ${response.status}`);
      }
      return (await response.json()) as PreciosClarosResponse;
    } catch (err) {
      lastError = err;
      console.error(`[sync] fetchPage intento ${attempt + 1}/${maxRetries + 1} falló`, {
        offset,
        err: err instanceof Error ? err.message : String(err),
      });
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`fetchPage falló tras ${maxRetries + 1} intentos`);
}
