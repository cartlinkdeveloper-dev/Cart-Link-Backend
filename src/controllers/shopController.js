const mongoose = require('mongoose');
const Shop = require('../models/Shop'); // adjust path if your model is elsewhere

exports.getAllShops = async (req, res) => {
    try {
        const shops = await Shop.find().lean();
        return res.json({ success: true, data: shops });
    } catch (err) {
        console.error('getAllShops error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.searchShops = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Search in shop name, address, and description using regex for case-insensitive search
        const searchQuery = {
            $or: [
                { shopName: { $regex: q, $options: 'i' } },
                { shopAddress: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        };

        const shops = await Shop.find(searchQuery)
            // ensure _id is present for navigation / detail fetches
            .select('_id shopName shopAddress shopImage description followers')
            .limit(50)
            .lean();

        return res.json({ success: true, data: shops });
    } catch (err) {
        console.error('searchShops error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getShopById = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).lean();
        if (!shop) return res.status(404).json({ success: false, message: 'Not found' });
        return res.json({ success: true, data: shop });
    } catch (err) {
        console.error('getShopById error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getShopFollowers = async (req, res) => {
    try {
        const { id } = req.params;
        const shop = await Shop.findById(id).populate('followers', 'customerName email').lean();
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        const followers = shop.followers || [];
        return res.json({
            success: true,
            data: {
                count: followers.length,
                followers: followers
            }
        });
    } catch (err) {
        console.error('getShopFollowers error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

