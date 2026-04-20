const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const purchaseController = require('../controllers/purchase.controller');

const router = Router();

router.get('/', authMiddleware, purchaseController.list);
router.get('/:id', authMiddleware, purchaseController.getById);

module.exports = router;
