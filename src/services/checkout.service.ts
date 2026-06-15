import * as checkoutRepository from '../repositories/checkout.repository';
import * as cartRepository from '../repositories/cart.repository';
import { mercadopagoGateway } from '../config/mercadopago';
import { DEFAULT_TAX_RATE, itemsTotal } from './pricing.service';
import { getEnvString } from '../utils/env';
import { ApiError } from '../utils/ApiError';
import type { PaymentGateway } from './paymentGateway';
import type { CheckoutResponse, CheckoutStatusResponse } from '../types/domain';

const STATUS_MAP: Record<string, 'completed' | 'failed' | 'pending'> = {
  approved: 'completed',
  rejected: 'failed',
  pending: 'pending',
};

interface WebhookBody {
  type?: string;
  data?: { id?: string | number };
}

// DIP: CheckoutService depende del puerto PaymentGateway, no del SDK de Mercado
// Pago. La instancia default (checkoutService) se cablea con el adapter real; los
// tests inyectan un fake sin tocar la red. Mismo patrón que PurchaseService.
export class CheckoutService {
  constructor(private readonly gateway: PaymentGateway) {}

  /**
   * Seguro anti-cobro real: salvo MP_REQUIRE_TEST_USER='false', el checkout solo
   * corre si el token es de un usuario de prueba (tag 'test_user'). Falla
   * cerrado: ante la duda, bloquea en vez de cobrar de verdad.
   */
  private async assertTestCredentials(): Promise<void> {
    if (getEnvString('MP_REQUIRE_TEST_USER') === 'false') return;
    const tags = await this.gateway.getAccountTags();
    if (!tags.includes('test_user')) {
      throw new ApiError(
        'Pagos deshabilitados: se requieren credenciales de prueba de Mercado Pago (usuario de prueba). ' +
          'Configurá un MP_ACCESS_TOKEN de test user o seteá MP_REQUIRE_TEST_USER=false para habilitar cobros reales.',
        503,
      );
    }
  }

  async createPreference(userId: string): Promise<CheckoutResponse> {
    await this.assertTestCredentials();

    const cart = await cartRepository.findActiveCartByUserId(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new ApiError('No hay carrito activo con items', 400);
    }

    const items = cart.items.map((item) => ({
      id: item.product?.id || item.id,
      title: item.product?.name || 'Producto',
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      currency_id: 'ARS',
    }));

    // back_url al que MP redirige tras el pago; la pagina /return reenvia al deep
    // link de la app. El webhook notifica aprobacion/rechazo (se setea por
    // preferencia, mas robusto que la config global del panel MP). El detalle del
    // formato MP (back_urls, auto_return) vive en el adapter del gateway.
    const baseUrl = getEnvString('PUBLIC_BASE_URL', 'https://changuiapp-backend.onrender.com');
    const backUrl = `${baseUrl}/api/checkout/return`;

    const preference = await this.gateway.createPreference({
      items,
      externalReference: cart.id,
      notificationUrl: `${baseUrl}/api/checkout/webhook`,
      backUrl,
    });

    if (!preference.id || !preference.init_point) {
      throw new ApiError('Error al crear preferencia de pago', 500);
    }

    // Linkea la preferencia al carrito para correlacionar la compra (creada por el
    // webhook) con este checkout y poder consultar su estado de forma deterministica.
    await checkoutRepository.savePreferenceId(cart.id, preference.id);

    return {
      preference_id: preference.id,
      init_point: preference.init_point,
    };
  }

  async getCheckoutStatus(
    userId: string,
    preferenceId: string,
  ): Promise<CheckoutStatusResponse> {
    const purchase = await checkoutRepository.findPurchaseByPreferenceId(userId, preferenceId);
    if (!purchase) {
      // El webhook aun no proceso el pago, o fue rechazado (no crea purchase).
      return { status: 'not_found' };
    }
    return { status: purchase.payment_status };
  }

  async handleWebhook(body: WebhookBody): Promise<void> {
    if (body.type !== 'payment' || !body.data?.id) return;

    const info = await this.gateway.getPayment(String(body.data.id));
    if (!info) return;

    const cartId = info.external_reference;
    if (!cartId) return;

    const cart = await checkoutRepository.findCartById(cartId);
    if (!cart) return;

    if (info.status !== 'approved') return;

    const items = cart.items || [];
    const total = itemsTotal(items);

    const purchase = await checkoutRepository.createPurchase({
      user_id: cart.user_id,
      store_id: cart.store_id,
      total,
      payment_id: String(info.id),
      payment_status: STATUS_MAP[info.status] || 'pending',
      mp_preference_id: cart.mp_preference_id ?? null,
    });

    const rows = items.map((i) => ({
      purchase_id: purchase.id,
      product_name: i.product?.name || 'Producto',
      barcode: i.product?.barcode || '',
      quantity: i.quantity,
      unit_price: i.unit_price,
      tax_rate: i.product?.tax_category?.rate ?? DEFAULT_TAX_RATE,
    }));

    await checkoutRepository.insertPurchaseItems(rows);
    await checkoutRepository.closeCart(cart.id);
  }
}

// Composition root: instancia default cableada con el adapter de Mercado Pago.
// Los controllers usan esta instancia; los tests inyectan un fake gateway.
export const checkoutService = new CheckoutService(mercadopagoGateway);
