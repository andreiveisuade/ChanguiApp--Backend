const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const productController = require('../controllers/product.controller');

const router = Router();

router.get('/barcode/:code', authMiddleware, productController.getByBarcode);

module.exports = router;
