const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['offer', 'order', 'general'], default: 'general' },
    data: { type: mongoose.Schema.Types.Mixed }, // Additional data like productId, shopId
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'notifications' });

module.exports = mongoose.model('Notification', NotificationSchema);