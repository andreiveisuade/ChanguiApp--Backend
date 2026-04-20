import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.delete('/profile', authMiddleware, userController.deleteProfile);

export default router;
