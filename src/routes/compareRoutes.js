const express = require('express');
const router = express.Router();
const compareController = require('../controllers/compareController');

// Get comparison list for a customer
router.get('/', compareController.getCompareList);

// Add product to comparison
router.post('/', compareController.addToCompare);

// Remove product from comparison
router.delete('/:productId', compareController.removeFromCompare);

// Clear entire comparison list
router.post('/clear', compareController.clearCompareList);

module.exports = router;
