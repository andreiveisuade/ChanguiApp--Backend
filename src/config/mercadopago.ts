import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN ?? '';
const client = new MercadoPagoConfig({ accessToken });

export const preference = new Preference(client);
export const payment = new Payment(client);

let cachedTags: string[] | null = null;

/**
 * Tags de la cuenta dueña del MP_ACCESS_TOKEN (GET /users/me).
 * Los usuarios de prueba de Mercado Pago traen el tag 'test_user'.
 * Se usa para garantizar que el checkout solo corra con credenciales de prueba.
 * Cacheado en memoria: el token no cambia en runtime.
 */
export async function getAccountTags(): Promise<string[]> {
  if (cachedTags) return cachedTags;
  try {
    const res = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { tags?: unknown };
    cachedTags = Array.isArray(data.tags) ? (data.tags as string[]) : [];
    return cachedTags;
  } catch {
    return [];
  }
}
