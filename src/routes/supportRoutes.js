const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');

// Create support ticket
router.post('/', supportController.createSupportTicket);

// Get all tickets (admin)
router.get('/', supportController.getAllTickets);

// Get tickets by customer
router.get('/customer/:customerId', supportController.getTicketsByCustomer);

// Get tickets by status
router.get('/status/:status', supportController.getTicketsByStatus);

// Get single ticket
router.get('/:id', supportController.getTicketById);

// Update ticket status
router.patch('/:id', supportController.updateTicketStatus);

// Delete ticket
router.delete('/:id', supportController.deleteTicket);

module.exports = router;
