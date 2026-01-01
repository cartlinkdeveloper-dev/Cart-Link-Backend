const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

// Read-only routes: only GETs retained
router.get('/', shopController.getAllShops);
router.get('/search', shopController.searchShops);
router.get('/:id', shopController.getShopById);
router.get('/:id/followers', shopController.getShopFollowers);
module.exports = router;