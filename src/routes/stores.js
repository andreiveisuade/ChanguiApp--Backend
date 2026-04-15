'use strict';

const { Router } = require('express');
const authenticate = require('../middleware/auth');
const storeController = require('../controllers/store.controller');

const router = Router();

router.get('/', authenticate, storeController.list);

module.exports = router;
