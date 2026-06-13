import * as productRepository from '../repositories/product.repository';
import * as syncJobsRepository from '../repositories/sync_jobs.repository';
import * as storeRepository from '../repositories/store.repository';
import * as classificationService from './classification.service';
import { ApiError } from '../types/domain';
import type { SyncJob } from '../types/domain';

export const SYNC_TYPE_PRECIOS_CLAROS = 'precios_claros';
export const PAGE_LIMIT = 100;

export interface PreciosClarosProduct {
  id: string;
  nombre: string;
  marca: string;
  precioMax?: string;
  precio?: string;
  imagen?: string;
}

interface PreciosClarosResponse {
  total: number;
  productos: PreciosClarosProduct[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDelayMs(): number {
  const raw = process.env.SYNC_DELAY_MS;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  // 2000ms default — alivia presión sobre Render free tier (CPU/memoria
  // compartidas con otras requests). Con 300ms el server respondía 503
  // a /health durante el sync. 2000ms hace el sync ~5 min en lugar de
  // ~1.5 min pero deja al event loop atender otras requests.
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 2000;
}

function getEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

// Precios Claros (CloudFront) rate-limitea y devuelve 403/429/5xx de forma
// intermitente. Sin reintentos, ~2 de cada 3 syncs bajaban 0 productos. El
// backoff exponencial (1s, 2s, 4s) recupera la mayoría de esos fallos.
const FETCH_TIMEOUT_MS = 30000;

async function fetchPage(
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

function mapProduct(p: PreciosClarosProduct): productRepository.ProductUpsertInput {
  return {
    barcode: p.id,
    name: p.nombre,
    brand: p.marca,
    price: parseFloat(p.precioMax || p.precio || '0'),
    image_url: p.imagen ?? undefined,
  };
}

// Ingesta de un lote de productos crudos de Precios Claros que ya bajó el
// runner de CI (DEV-XXX). El fetch al CDN se hace desde la IP limpia del
// runner porque la IP saliente compartida del free tier de Render está
// filtrada por el CDN y recibe 200 con catálogo vacío. El backend acá solo
// mapea y upsertea: nunca toca Precios Claros.
export async function ingestProductsBatch(productos: PreciosClarosProduct[]): Promise<number> {
  const mapped = productos.filter((p) => p && p.id).map(mapProduct);
  await productRepository.upsertBatch(mapped);
  return mapped.length;
}

// El free tier de Render reinicia el dyno a mitad de un sync largo y deja el job
// huérfano en 'running' para siempre, bloqueando el cron con 409. Si un 'running'
// lleva más de este umbral, lo tratamos como muerto y seguimos.
function getStaleMs(): number {
  return getEnvInt('SYNC_STALE_MS', 15 * 60 * 1000);
}

function isStale(job: SyncJob): boolean {
  return Date.now() - Date.parse(job.started_at) > getStaleMs();
}

// Offset de arranque: si el último job quedó a medias (partial, o failed/huérfano
// con progreso), reanudamos desde su last_offset en vez de rebajar todo de cero.
// Si el último completó, arrancamos de 0 (refresco completo del catálogo).
async function computeResumeOffset(): Promise<number> {
  const last = await syncJobsRepository.findLatest(SYNC_TYPE_PRECIOS_CLAROS);
  if (!last || last.status === 'completed' || last.last_offset <= 0) return 0;
  if (last.total_target !== null && last.last_offset >= last.total_target) return 0;
  return last.last_offset;
}

export async function startPreciosClarosSync(): Promise<{ sync_id: string }> {
  const running = await syncJobsRepository.findRunning(SYNC_TYPE_PRECIOS_CLAROS);
  if (running) {
    if (!isStale(running)) {
      throw new ApiError('Ya hay un sync en curso', 409);
    }
    // Huérfano: el dyno murió sin marcar el job. Lo cerramos para destrabar.
    await syncJobsRepository.markFailed(
      running.id,
      'Job huérfano: sin avanzar más allá del umbral (dyno reiniciado). Reanudado.',
    );
  }

  const resumeOffset = await computeResumeOffset();
  const job = await syncJobsRepository.create(SYNC_TYPE_PRECIOS_CLAROS);

  void runPreciosClarosSync(job.id, resumeOffset).catch((err) => {
    console.error('[sync] runner falló sin atrapar:', err);
  });

  return { sync_id: job.id };
}

export async function runPreciosClarosSync(jobId: string, startOffset = 0): Promise<void> {
  const baseUrl = process.env.PRECIOS_CLAROS_URL;
  const storeId = process.env.MVP_STORE_PRECIOS_CLAROS_ID;
  const delayMs = getDelayMs();

  if (!baseUrl || !storeId) {
    await syncJobsRepository.markFailed(
      jobId,
      'PRECIOS_CLAROS_URL o MVP_STORE_PRECIOS_CLAROS_ID no configurado',
    );
    return;
  }

  try {
    const head = await fetchPage(baseUrl, storeId, 1, 0);
    const total = head.total ?? 0;
    await syncJobsRepository.setTotal(jobId, total);

    // Un catálogo real nunca es 0. Si total=0, la API falló (rate-limit/caída)
    // y los reintentos no alcanzaron: marcar failed en vez de completed para
    // no enmascarar el problema ni pisar el catálogo bueno con un sync vacío.
    if (total === 0) {
      await syncJobsRepository.markFailed(
        jobId,
        'Precios Claros devolvió 0 productos (probable rate-limit o caída de la API)',
      );
      return;
    }

    // Procesamos como mucho un chunk acotado por corrida y dejamos el job en
    // 'partial' si falta. El cron reanuda desde last_offset en la próxima
    // corrida: procesos cortos que entran en el free tier sin reiniciar el dyno.
    const maxPages = getEnvInt('SYNC_MAX_PAGES_PER_RUN', 25);
    const chunkCeiling = startOffset + maxPages * PAGE_LIMIT;

    let processed = 0;
    let errors = 0;
    let offset = startOffset;
    let reachedEnd = false;

    while (offset < total && offset < chunkCeiling) {
      const page = await fetchPage(baseUrl, storeId, PAGE_LIMIT, offset);
      const productos = page.productos ?? [];

      // Página vacía = la API no devolvió más: fin del catálogo (o total
      // sobreestimado). Cortamos como fin para no reanudar el mismo offset.
      if (productos.length === 0) {
        reachedEnd = true;
        break;
      }

      try {
        await productRepository.upsertBatch(productos.map(mapProduct));
        processed += productos.length;
      } catch (err) {
        errors += productos.length;
        console.error('[sync] batch upsert falló', { offset, err });
      }

      offset += productos.length;
      await syncJobsRepository.updateProgress(jobId, processed, offset, errors);

      // Página incompleta = fin real del catálogo, aunque total estimara más.
      if (productos.length < PAGE_LIMIT) {
        reachedEnd = true;
        break;
      }
      if (delayMs > 0) await sleep(delayMs);
    }

    // Cortamos por el techo del chunk y todavía falta catálogo: dejamos el job
    // reanudable (partial) y salimos sin reclasificar hasta completar.
    if (!reachedEnd && offset < total) {
      await syncJobsRepository.markPartial(jobId, offset);
      return;
    }

    await storeRepository.markSyncedByPreciosClarosId(storeId);

    // Clasificación fiscal de los productos nuevos/no bloqueados. Un fallo acá
    // no invalida el sync de datos: los productos quedan en 'general' (21%).
    try {
      await classificationService.reclassifyAll();
    } catch (err) {
      console.error('[sync] reclasificación fiscal falló:', err);
    }

    await syncJobsRepository.markCompleted(jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sync] runner falló:', err);
    await syncJobsRepository.markFailed(jobId, message);
  }
}
