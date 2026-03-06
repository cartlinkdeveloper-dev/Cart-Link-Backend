const express = require('express');
const router = express.Router();
const shopSupportController = require('../controllers/shopSupportController');

// Create shop support ticket
router.post('/', shopSupportController.createShopSupportTicket);

// Get all shop support tickets (admin)
router.get('/', shopSupportController.getAllTickets);

// Get tickets by shop
router.get('/shop/:shopId', shopSupportController.getTicketsByShop);

// Get tickets by status
router.get('/status/:status', shopSupportController.getTicketsByStatus);

// Get single ticket
router.get('/:id', shopSupportController.getTicketById);

// Update ticket status
router.patch('/:id', shopSupportController.updateTicketStatus);

// Delete ticket
router.delete('/:id', shopSupportController.deleteTicket);

module.exports = router;
