const purchaseService = require('../services/purchase.service');

async function list(req, res, next) {
  try {
    const purchases = await purchaseService.list(req.user.id, req.query.status);
    res.json(purchases);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const purchase = await purchaseService.getById(req.user.id, req.params.id);
    res.json(purchase);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById };
