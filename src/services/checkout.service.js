const mercadopago = require('../config/mercadopago');
const checkoutRepository = require('../repositories/checkout.repository');

const STATUS_MAP = {
  approved: 'completed',
  rejected: 'failed',
  pending: 'pending',
};

async function createPreference(userId) {
  const cart = await checkoutRepository.findActiveCartByUserId(userId);
  if (!cart || !cart.items || cart.items.length === 0) {
    const err = new Error('No hay carrito activo con items');
    err.status = 400;
    throw err;
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

async function handleWebhook(body) {
  if (body.type !== 'payment' || !body.data?.id) return;

  const payment = await mercadopago.payment.findById(body.data.id);
  const info = payment.body;
  if (!info) return;

  const cartId = info.external_reference;
  if (!cartId) return;

  const cart = await checkoutRepository.findCartById(cartId);
  if (!cart) return;

  if (info.status !== 'approved') {
    return;
  }

  const total = (cart.items || []).reduce(
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

  await checkoutRepository.insertPurchaseItems(purchase.id, cart.items || []);
  await checkoutRepository.closeCart(cart.id);
}

module.exports = { createPreference, handleWebhook };
