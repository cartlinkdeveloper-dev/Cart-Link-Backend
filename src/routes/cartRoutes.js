const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.post('/', cartController.addToCart);
router.get('/customer/:customerId', cartController.getByCustomer);
router.patch('/:customerId/:shopId/item/:productId', cartController.updateCartItem);
router.delete('/:customerId/:shopId', cartController.deleteCart);

module.exports = router;
