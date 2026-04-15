const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const cartController = require('../controllers/cartController');

router.get('/', authMiddleware, cartController.getCart);
router.post('/items', authMiddleware, cartController.addItem);
router.put('/items/:id', authMiddleware, cartController.updateItem);
router.delete('/items/:id', authMiddleware, cartController.removeItem);

module.exports = router;

// DEV-20
