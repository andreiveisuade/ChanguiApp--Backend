import { preference, payment, getAccountTags } from '../config/mercadopago';
import * as checkoutRepository from '../repositories/checkout.repository';
import {
  ApiError,
  type CheckoutResponse,
  type CheckoutStatusResponse,
} from '../types/domain';

const STATUS_MAP: Record<string, 'completed' | 'failed' | 'pending'> = {
  approved: 'completed',
  rejected: 'failed',
  pending: 'pending',
};

/**
 * Seguro anti-cobro real: salvo MP_REQUIRE_TEST_USER='false', el checkout solo
 * corre si el MP_ACCESS_TOKEN es de un usuario de prueba (tag 'test_user').
 * Falla cerrado: ante la duda, bloquea en vez de cobrar de verdad.
 */
async function assertTestCredentials(): Promise<void> {
  if (process.env.MP_REQUIRE_TEST_USER === 'false') return;
  const tags = await getAccountTags();
  if (!tags.includes('test_user')) {
    throw new ApiError(
      'Pagos deshabilitados: se requieren credenciales de prueba de Mercado Pago (usuario de prueba). ' +
        'Configurá un MP_ACCESS_TOKEN de test user o seteá MP_REQUIRE_TEST_USER=false para habilitar cobros reales.',
      503
    );
  }
}

export async function createPreference(userId: string): Promise<CheckoutResponse> {
  await assertTestCredentials();

  const cart = await checkoutRepository.findActiveCartByUserId(userId);
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new ApiError('No hay carrito activo con items', 400);
  }

  const mpItems = cart.items.map((item) => ({
    id: item.product?.id || item.id,
    title: item.product?.name || 'Producto',
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    currency_id: 'ARS',
  }));

  // Webhook publico para que Mercado Pago notifique aprobacion/rechazo del pago.
  // Se setea por preferencia (mas robusto que la config global del panel MP).
  const baseUrl = process.env.PUBLIC_BASE_URL || 'https://changuiapp-backend.onrender.com';

  // back_url al que MP redirige tras el pago. La pagina /return reenvia al deep
  // link de la app. auto_return hace el retorno automatico en approved.
  const backUrl = `${baseUrl}/api/checkout/return`;

  const response = await preference.create({
    body: {
      items: mpItems,
      external_reference: cart.id,
      notification_url: `${baseUrl}/api/checkout/webhook`,
      back_urls: { success: backUrl, pending: backUrl, failure: backUrl },
      auto_return: 'approved',
    },
  });

  if (!response.id || !response.init_point) {
    throw new ApiError('Error al crear preferencia de pago', 500);
  }

  // Linkea la preferencia al carrito para correlacionar la compra (creada por el
  // webhook) con este checkout y poder consultar su estado de forma deterministica.
  await checkoutRepository.savePreferenceId(cart.id, response.id);

  // En modo prueba (default) abrimos el sandbox_init_point: el checkout corre en
  // el entorno de prueba de MP y no debita dinero real.
  // Siempre usamos init_point. Con credenciales de test user (validadas por
  // assertTestCredentials), MP redirige automáticamente al entorno de prueba.
  // El sandbox_init_point apunta al subdominio legacy sandbox.mercadopago.com.ar
  // que tiene un bug de loop de redirección en la pantalla de login.
  const initPoint = response.init_point;

  return {
    preference_id: response.id,
    init_point: initPoint,
  };
}

export async function getCheckoutStatus(
  userId: string,
  preferenceId: string
): Promise<CheckoutStatusResponse> {
  const purchase = await checkoutRepository.findPurchaseByPreferenceId(userId, preferenceId);
  if (!purchase) {
    // El webhook aun no proceso el pago, o fue rechazado (no crea purchase).
    return { status: 'not_found' };
  }
  return { status: purchase.payment_status };
}

interface WebhookBody {
  type?: string;
  data?: { id?: string | number };
}

export async function handleWebhook(body: WebhookBody): Promise<void> {
  if (body.type !== 'payment' || !body.data?.id) return;

  const info = await payment.get({ id: String(body.data.id) });
  if (!info) return;

  const cartId = info.external_reference;
  if (!cartId) return;

  const cart = await checkoutRepository.findCartById(cartId);
  if (!cart) return;

  if (info.status !== 'approved') return;

  const items = cart.items || [];
  const total = items.reduce(
    (sum, i) => sum + Number(i.unit_price) * i.quantity,
    0
  );

  const purchase = await checkoutRepository.createPurchase({
    user_id: cart.user_id,
    store_id: cart.store_id,
    total,
    payment_id: String(info.id),
    payment_status: STATUS_MAP[info.status] || 'pending',
    mp_preference_id: cart.mp_preference_id ?? null,
  });

  await checkoutRepository.insertPurchaseItems(purchase.id, items);
  await checkoutRepository.closeCart(cart.id);
}
