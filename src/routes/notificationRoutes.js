const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// GET /api/notifications?customerId=... or ?shopId=...
router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.post('/', notificationController.createNotification);

module.exports = router;