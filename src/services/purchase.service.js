const purchaseRepository = require('../repositories/purchase.repository');

async function list(userId, status) {
  return purchaseRepository.findByUserId(userId, status);
}

async function getById(userId, purchaseId) {
  const purchase = await purchaseRepository.findByIdAndUser(purchaseId, userId);
  if (!purchase) {
    const err = new Error('Compra no encontrada');
    err.status = 404;
    throw err;
  }
  return purchase;
}

module.exports = { list, getById };
