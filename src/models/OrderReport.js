const mongoose = require('mongoose');

// Order reports submitted by customers about completed/cancelled orders
const OrderReportSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Orders', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers', required: true },
  customerName: { type: String },
  reason: {
    type: String,
    enum: ['wrong_items', 'damaged_items', 'quality_issue', 'missing_items', 'fraud', 'other'],
    required: true,
  },
  details: { type: String, maxlength: 500 },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'rejected'],
    default: 'open',
  },
  reportedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'order_reports' });

// Index to find reports for an order
OrderReportSchema.index({ orderId: 1 });
// Index to find reports by customer
OrderReportSchema.index({ customerId: 1 });
// Index to prevent duplicate reports for same order per customer
OrderReportSchema.index({ orderId: 1, customerId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('OrderReport', OrderReportSchema);
