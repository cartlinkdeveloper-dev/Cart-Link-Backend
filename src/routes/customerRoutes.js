const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Public: list all customers
router.get('/', customerController.listAll);

// Follow/Unfollow shop
router.post('/follow-shop', customerController.followShop);

// Save FCM token for customer
router.post('/:id/fcm-token', customerController.updateFcmToken);

// Get followed shops for a customer
router.get('/:id/following', customerController.getFollowing);

// Update customer profile
router.put('/:id', customerController.updateProfile);

module.exports = router;
