const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/:customerId', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.post('/', notificationController.createNotification);

module.exports = router;