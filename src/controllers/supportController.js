const Support = require('../models/Support');

// Create support ticket
exports.createSupportTicket = async (req, res) => {
  try {
    const { customerId, customerName, customerEmail, category, subject, description, priority } = req.body;

    // Validate required fields
    if (!customerId || !customerName || !customerEmail || !category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    const supportTicket = new Support({
      customerId,
      customerName,
      customerEmail,
      category,
      subject,
      description,
      priority: priority || 'medium',
    });

    const savedTicket = await supportTicket.save();
    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: savedTicket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating support ticket',
      error: error.message,
    });
  }
};

// Get all support tickets (admin)
exports.getAllTickets = async (req, res) => {
  try {
    const source = req.query.source;

    let tickets;

    if (source === 'shop') {
      // Return tickets submitted by shop owners
      try {
        const ShopOwner = require('../models/ShopOwner');
        const ownerIds = await ShopOwner.find().distinct('_id');
        tickets = await Support.find({ customerId: { $in: ownerIds } }).sort({ createdAt: -1 });
      } catch (err) {
        // Fallback to returning all tickets if owner lookup fails
        tickets = await Support.find().sort({ createdAt: -1 });
      }
    } else if (source === 'customer') {
      // Return tickets submitted by regular customers (exclude owners)
      try {
        const ShopOwner = require('../models/ShopOwner');
        const ownerIds = await ShopOwner.find().distinct('_id');
        tickets = await Support.find({ customerId: { $nin: ownerIds } }).sort({ createdAt: -1 });
      } catch (err) {
        tickets = await Support.find().sort({ createdAt: -1 });
      }
    } else {
      tickets = await Support.find().sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      data: tickets,
      total: tickets.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message,
    });
  }
};

// Get tickets by customer
exports.getTicketsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const tickets = await Support.find({ customerId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: tickets,
      total: tickets.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer tickets',
      error: error.message,
    });
  }
};

// Get single ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Support.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket',
      error: error.message,
    });
  }
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const updateData = { status, updatedAt: Date.now() };
    
    if (adminResponse) {
      updateData.adminResponse = adminResponse;
      updateData.respondedAt = Date.now();
    }

    const ticket = await Support.findByIdAndUpdate(id, updateData, { new: true });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating ticket',
      error: error.message,
    });
  }
};

// Get tickets by status
exports.getTicketsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const tickets = await Support.find({ status }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: tickets,
      total: tickets.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message,
    });
  }
};

// Delete support ticket
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Support.findByIdAndDelete(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting ticket',
      error: error.message,
    });
  }
};
