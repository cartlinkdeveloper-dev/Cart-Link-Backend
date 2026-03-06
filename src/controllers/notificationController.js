const mongoose = require('mongoose');
const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        // can filter by customerId or shopId via query params
        const { customerId, shopId } = req.query;
        const filter = {};

        if (customerId) {
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                return res.status(400).json({ success: false, message: 'Invalid customer ID' });
            }
            filter.customerId = customerId;
        }

        if (shopId) {
            if (!mongoose.Types.ObjectId.isValid(shopId)) {
                return res.status(400).json({ success: false, message: 'Invalid shop ID' });
            }
            filter.shopId = shopId;
        }

        // if neither provided, return empty list to avoid exposing all notifications
        if (Object.keys(filter).length === 0) {
            return res.status(400).json({ success: false, message: 'customerId or shopId required' });
        }

        const notifications = await Notification.find(filter)
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

exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid notification ID' });
        }

        const deleted = await Notification.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        return res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
        console.error('deleteNotification error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createNotification = async (req, res) => {
    try {
        const { customerId, shopId, title, message, type, data } = req.body;

        if ((!customerId && !shopId) || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Either customerId or shopId, along with title and message, are required',
            });
        }

        const notification = new Notification({
            customerId,
            shopId,
            title,
            message,
            type: type || 'general',
            data: data || {},
        });

        await notification.save();
        return res.status(201).json({ success: true, message: 'Notification created', data: notification });
    } catch (err) {
        console.error('createNotification error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};