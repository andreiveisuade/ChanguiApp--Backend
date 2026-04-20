const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const checkoutController = require('../controllers/checkout.controller');

const router = Router();

router.post('/', authMiddleware, checkoutController.create);
router.post('/webhook', checkoutController.webhook);

module.exports = router;
