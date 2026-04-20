const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/user.controller');

const router = Router();

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.delete('/profile', authMiddleware, userController.deleteProfile);

module.exports = router;
