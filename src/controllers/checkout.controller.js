const checkoutService = require('../services/checkout.service');

async function create(req, res, next) {
  try {
    const result = await checkoutService.createPreference(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function webhook(req, res) {
  try {
    await checkoutService.handleWebhook(req.body);
  } catch (err) {
    console.error('Webhook error:', err);
  }
  res.status(200).json({ received: true });
}

module.exports = { create, webhook };
