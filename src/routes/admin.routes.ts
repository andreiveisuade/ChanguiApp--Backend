import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';

const router = Router();

router.post('/sync-precios-claros', adminController.syncPreciosClarosHandler);

export default router;
