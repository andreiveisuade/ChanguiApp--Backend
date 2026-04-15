const productRepository = require('../repositories/product.repository');

async function getByBarcode(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    const err = new Error('Barcode inválido');
    err.status = 400;
    throw err;
  }

  const product = await productRepository.findByBarcode(barcode);

  if (!product) {
    const err = new Error('Producto no encontrado');
    err.status = 404;
    throw err;
  }

  return product;
}

module.exports = { getByBarcode };
