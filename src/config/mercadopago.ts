import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import type {
  CreatePreferenceInput,
  PaymentGateway,
  PaymentInfo,
  PaymentPreference,
} from '../services/paymentGateway';

const accessToken = process.env.MP_ACCESS_TOKEN ?? '';
const client = new MercadoPagoConfig({ accessToken });
const preference = new Preference(client);
const payment = new Payment(client);

let cachedTags: string[] | null = null;

/**
 * Tags de la cuenta dueña del MP_ACCESS_TOKEN (GET /users/me).
 * Los usuarios de prueba de Mercado Pago traen el tag 'test_user'.
 * Se usa para garantizar que el checkout solo corra con credenciales de prueba.
 * Cacheado en memoria: el token no cambia en runtime.
 */
async function getAccountTags(): Promise<string[]> {
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

/**
 * Adapter del SDK de Mercado Pago al puerto PaymentGateway. Traduce el input de
 * dominio al formato del SDK (body, back_urls triple, auto_return) y resuelve el
 * init_point de producción. (Siempre init_point, nunca sandbox_init_point: el
 * subdominio legacy de sandbox tiene un bug de loop de redirección en el login;
 * con credenciales de test user MP ya redirige al entorno de prueba.)
 */
export const mercadopagoGateway: PaymentGateway = {
  getAccountTags,

  async createPreference(input: CreatePreferenceInput): Promise<PaymentPreference> {
    const response = await preference.create({
      body: {
        items: input.items,
        external_reference: input.externalReference,
        notification_url: input.notificationUrl,
        back_urls: { success: input.backUrl, pending: input.backUrl, failure: input.backUrl },
        auto_return: 'approved',
      },
    });
    return { id: response.id, init_point: response.init_point };
  },

  async getPayment(id: string): Promise<PaymentInfo | null> {
    const info = await payment.get({ id });
    if (!info) return null;
    return {
      id: info.id ?? id,
      status: info.status ?? 'unknown',
      external_reference: info.external_reference,
    };
  },
};
