import mercadopago from '../config/mercadopago';
import * as checkoutRepository from '../repositories/checkout.repository';
import { ApiError, type CheckoutResponse } from '../types/domain';

const STATUS_MAP: Record<string, 'completed' | 'failed' | 'pending'> = {
  approved: 'completed',
  rejected: 'failed',
  pending: 'pending',
};

export async function createPreference(userId: string): Promise<CheckoutResponse> {
  const cart = await checkoutRepository.findActiveCartByUserId(userId);
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new ApiError('No hay carrito activo con items', 400);
  }

  const mpItems = cart.items.map((item) => ({
    title: item.product?.name || 'Producto',
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    currency_id: 'ARS',
  }));

  const response = await mercadopago.preferences.create({
    items: mpItems,
    external_reference: cart.id,
  });

  return {
    preference_id: response.body.preference_id,
    init_point: response.body.init_point,
  };
}

interface WebhookBody {
  type?: string;
  data?: { id?: string | number };
}

export async function handleWebhook(body: WebhookBody): Promise<void> {
  if (body.type !== 'payment' || !body.data?.id) return;

  const payment = await mercadopago.payment.findById(body.data.id);
  const info = payment.body;
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
  });

  await checkoutRepository.insertPurchaseItems(purchase.id, items);
  await checkoutRepository.closeCart(cart.id);
}
