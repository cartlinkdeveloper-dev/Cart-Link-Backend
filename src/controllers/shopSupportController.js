const ShopSupport = require('../models/ShopSupport');

// Create shop support ticket
exports.createShopSupportTicket = async (req, res) => {
  try {
    const { shopId, shopName, shopEmail, category, subject, description } = req.body;

    // Validate required fields
    if (!shopId || !shopName || !shopEmail || !category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    const shopSupportTicket = new ShopSupport({
      shopId,
      shopName,
      shopEmail,
      category,
      subject,
      description,
    });

    const savedTicket = await shopSupportTicket.save();
    res.status(201).json({
      success: true,
      message: 'Shop support ticket created successfully',
      data: savedTicket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating shop support ticket',
      error: error.message,
    });
  }
};

// Get all shop support tickets (admin)
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await ShopSupport.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tickets,
      total: tickets.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shop support tickets',
      error: error.message,
    });
  }
};

// Get tickets by shop
exports.getTicketsByShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const tickets = await ShopSupport.find({ shopId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: tickets,
      total: tickets.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shop support tickets',
      error: error.message,
    });
  }
};

// Get tickets by status
exports.getTicketsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const tickets = await ShopSupport.find({ status }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: tickets,
      total: tickets.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shop support tickets by status',
      error: error.message,
    });
  }
};

// Get single ticket
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await ShopSupport.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Shop support ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shop support ticket',
      error: error.message,
    });
  }
};

// Update ticket status and add admin response
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

    const updateData = {
      status,
      updatedAt: new Date(),
    };

    if (adminResponse) {
      updateData.adminResponse = adminResponse;
      updateData.respondedAt = new Date();
    }

    const ticket = await ShopSupport.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Shop support ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Shop support ticket updated successfully',
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating shop support ticket',
      error: error.message,
    });
  }
};

// Delete ticket
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await ShopSupport.findByIdAndDelete(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Shop support ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Shop support ticket deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting shop support ticket',
      error: error.message,
    });
  }
};
