const mongoose = require('mongoose');
const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ success: false, message: 'Invalid customer ID' });
        }

        const notifications = await Notification.find({ customerId })
            .sort({ createdAt: -1 })
            .lean();

        return res.json({ success: true, data: notifications });
    } catch (err) {
        console.error('getNotifications error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid notification ID' });
        }

        const updated = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        return res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
        console.error('markAsRead error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createNotification = async (req, res) => {
    try {
        const { customerId, title, message, type, data } = req.body;

        if (!customerId || !title || !message) {
            return res.status(400).json({ success: false, message: 'customerId, title, and message are required' });
        }

        const notification = new Notification({
            customerId,
            title,
            message,
            type: type || 'general',
            data: data || {}
        });

        await notification.save();
        return res.status(201).json({ success: true, message: 'Notification created', data: notification });
    } catch (err) {
        console.error('createNotification error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};