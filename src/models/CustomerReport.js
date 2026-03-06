const mongoose = require('mongoose');

// Reports submitted by customers about shops, products or other users.
// These can be used to trigger notifications for the admin or the target entity.
const CustomerReportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers', required: true },
  targetType: {
    type: String,
    enum: ['shop', 'product', 'user', 'order'],
    required: true,
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'customer_reports' });

module.exports = mongoose.model('CustomerReport', CustomerReportSchema);
