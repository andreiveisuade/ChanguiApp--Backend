import * as productRepository from '../repositories/product.repository';
import { supabase } from '../config/supabase';

interface PreciosClarosProduct {
  id: string;
  nombre: string;
  marca: string;
  precioMax?: string;
  precio?: string;
  imagen?: string;
}

export async function syncPreciosClaros(): Promise<{
  created: number;
  updated: number;
  errors: number;
  duration_ms: number;
}> {
  const start = Date.now();
  const baseUrl = process.env.PRECIOS_CLAROS_URL;
  const storeId = process.env.MVP_STORE_PRECIOS_CLAROS_ID;

  let created = 0;
  let updated = 0;
  let errors = 0;

  const MAX_PRODUCTS = 1000;
  const limit = 100;
  let offset = 0;
  const allProducts: PreciosClarosProduct[] = [];

  while (true) {
    const url = `${baseUrl}/productos?string=&limit=${limit}&offset=${offset}&id_sucursal=${storeId}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChanguiApp/1.0)' },
    });
    const body = (await response.json()) as { productos: PreciosClarosProduct[] };
    const productos = body.productos;

    if (!productos || productos.length === 0) break;

    allProducts.push(...productos);

    if (allProducts.length >= MAX_PRODUCTS) break;
    if (productos.length < limit) break;
    offset += limit;
  }

  const batchSize = 50;
  for (let i = 0; i < allProducts.length; i += batchSize) {
    const batch = allProducts.slice(i, i + batchSize);

    for (const p of batch) {
      try {
        const mapped = {
          barcode: p.id,
          name: p.nombre,
          brand: p.marca,
          price: parseFloat(p.precioMax || p.precio || '0'),
          image_url: p.imagen ?? undefined,
        };

        const result = await productRepository.upsertByBarcode(mapped);
        if (result.created) created++;
        else updated++;
      } catch (err) {
        errors++;
        console.error('Error syncing product:', p.id, err);
      }
    }
  }

  await supabase
    .from('stores')
    .update({ synced_at: new Date().toISOString() })
    .eq('precios_claros_id', storeId);

  return { created, updated, errors, duration_ms: Date.now() - start };
}
