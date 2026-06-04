import * as productRepository from '../repositories/product.repository';
import * as syncJobsRepository from '../repositories/sync_jobs.repository';
import * as classificationService from './classification.service';
import { supabase } from '../config/supabase';
import { ApiError } from '../types/domain';

export const SYNC_TYPE_PRECIOS_CLAROS = 'precios_claros';
export const PAGE_LIMIT = 100;

interface PreciosClarosProduct {
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

async function fetchPage(
  baseUrl: string,
  storeId: string,
  limit: number,
  offset: number,
): Promise<PreciosClarosResponse> {
  const url = `${baseUrl}/productos?string=&limit=${limit}&offset=${offset}&id_sucursal=${storeId}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChanguiApp/1.0)' },
  });
  return (await response.json()) as PreciosClarosResponse;
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

export async function startPreciosClarosSync(): Promise<{ sync_id: string }> {
  const running = await syncJobsRepository.findRunning(SYNC_TYPE_PRECIOS_CLAROS);
  if (running) {
    throw new ApiError('Ya hay un sync en curso', 409);
  }

  const job = await syncJobsRepository.create(SYNC_TYPE_PRECIOS_CLAROS);

  void runPreciosClarosSync(job.id).catch((err) => {
    console.error('[sync] runner falló sin atrapar:', err);
  });

  return { sync_id: job.id };
}

export async function runPreciosClarosSync(jobId: string): Promise<void> {
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

    let processed = 0;
    let errors = 0;
    let offset = 0;

    while (offset < total) {
      const page = await fetchPage(baseUrl, storeId, PAGE_LIMIT, offset);
      const productos = page.productos ?? [];

      if (productos.length === 0) break;

      try {
        await productRepository.upsertBatch(productos.map(mapProduct));
        processed += productos.length;
      } catch (err) {
        errors += productos.length;
        console.error('[sync] batch upsert falló', { offset, err });
      }

      offset += productos.length;
      await syncJobsRepository.updateProgress(jobId, processed, offset, errors);

      if (productos.length < PAGE_LIMIT) break;
      if (delayMs > 0) await sleep(delayMs);
    }

    await supabase
      .from('stores')
      .update({ synced_at: new Date().toISOString() })
      .eq('precios_claros_id', storeId);

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
