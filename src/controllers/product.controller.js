const productService = require('../services/product.service');

async function getByBarcode(req, res, next) {
  try {
    const { code } = req.params;
    const product = await productService.getByBarcode(code);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

module.exports = { getByBarcode };
