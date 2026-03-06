const mongoose = require('mongoose');
const Shop = require('../models/Shop'); // adjust path if your model is elsewhere
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

exports.getAllShops = async (req, res) => {
    try {
        let shops = await Shop.find().lean();
        // ensure rating fields exist for legacy docs
        shops = await Promise.all(shops.map(async (shop) => {
            if (shop.avgRating == null || shop.ratingCount == null) {
                const data = await Review.aggregate([
                    { $match: { shopId: new mongoose.Types.ObjectId(shop._id) } },
                    { $group: { _id: null, avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
                ]);
                if (data.length > 0) {
                    shop.avgRating = data[0].avg;
                    shop.ratingCount = data[0].cnt;
                } else {
                    shop.avgRating = 0;
                    shop.ratingCount = 0;
                }
            }
            return shop;
        }));
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
        if (shop.avgRating == null || shop.ratingCount == null) {
            const data = await Review.aggregate([
                { $match: { shopId: new mongoose.Types.ObjectId(shop._id) } },
                { $group: { _id: null, avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
            ]);
            shop.avgRating = data.length > 0 ? data[0].avg : 0;
            shop.ratingCount = data.length > 0 ? data[0].cnt : 0;
        }
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

exports.getShopStats = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid shop ID' });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const [ordersToday, productsCount] = await Promise.all([
            Order.find({
                shopId: id,
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                orderStatus: { $ne: 'cancelled' },
            }).select('totalAmount').lean(),
            Product.countDocuments({ ownerId: id }),
        ]);

        const todayOrders = ordersToday.length;
        const todaySales = ordersToday.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        return res.json({
            success: true,
            data: {
                todaySales,
                todayOrders,
                productsCount,
            },
        });
    } catch (err) {
        console.error('getShopStats error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// update shop details (owner can change profile fields)
exports.updateShop = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid shop ID' });
        }

        const updates = { ...req.body, updatedAt: Date.now() };
        const allowed = ['shopName', 'ownerName', 'location', 'contact', 'email', 'address', 'autoAcceptOrders', 'profilePicture'];
        const payload = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) payload[key] = updates[key];
        }

        const shop = await Shop.findByIdAndUpdate(id, payload, { new: true }).lean();
        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }
        return res.json({ success: true, data: shop });
    } catch (err) {
        console.error('updateShop error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

