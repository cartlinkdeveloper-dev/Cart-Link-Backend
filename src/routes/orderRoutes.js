const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Create a new order (checkout)
router.post('/', orderController.createOrder);

// Get orders by customer ID
router.get('/customer/:customerId', orderController.getByCustomer);

// Get orders by shop ID
router.get('/shop/:shopId', orderController.getByShop);

// Get order by ID
router.get('/:orderId', orderController.getById);

// Update order status
router.patch('/:orderId/status', orderController.updateStatus);

// Cancel product from order by quantity
router.post('/:orderId/cancel-product', orderController.cancelProduct);

// Undo cancellation of a product (restore quantity)
router.post('/:orderId/undo-cancel-product', orderController.undoCancelProduct);


// Verify OTP and mark order as delivered
router.patch('/:orderId/verify-otp', orderController.verifyOtpAndDeliver);


module.exports = router;
