const mongoose = require('mongoose');
const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, mrp, stock, inStock, sku, category, isActive, isFeatured, images, ownerId } = req.body;

        if (!name || !description || price == null) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Determine boolean availability: prefer explicit inStock, else derive from numeric stock if provided, otherwise default true
        const availability = (inStock !== undefined) ? !!inStock : (stock !== undefined ? Number(stock) > 0 : true);

        const product = new Product({
            name,
            description,
            price: Number(price),
            mrp: mrp != null ? Number(mrp) : undefined,
            // optional numeric stock retained for backward compatibility
            stock: (stock !== undefined) ? Number(stock) : undefined,
            inStock: availability,
            sku,
            category,
            ownerId: ownerId || null,
            isActive: !!isActive,
            isFeatured: !!isFeatured,
            images: Array.isArray(images) ? images : [],
        });

        await product.save();

        // Send notifications to followers
        if (product.ownerId) {
            try {
                const Shop = require('../models/Shop');
                const Notification = require('../models/Notification');

                const shop = await Shop.findById(product.ownerId).select('followers shopName').lean();
                if (shop && shop.followers && shop.followers.length > 0) {
                    const notifications = shop.followers.map(followerId => ({
                        customerId: followerId,
                        title: 'New Product Available',
                        message: `Check out the new product: ${product.name}${product.category ? ` (${product.category})` : ''} from ${shop.shopName}`,
                        type: 'offer',
                        data: { productId: product._id, shopId: product.ownerId, image: product.images?.[0] || null, category: product.category || null }
                    }));

                    await Notification.insertMany(notifications);
                    console.log(`Sent ${notifications.length} notifications for new product: ${product.name}`);
                }
            } catch (notifErr) {
                console.error('Error sending notifications:', notifErr);
                // Don't fail the product creation if notifications fail
            }
        }

        return res.status(201).json({ success: true, message: 'Product created', data: product });
    } catch (err) {
        console.error('createProduct error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const { ownerId } = req.query || {};

        let filter = {};
        if (ownerId) {
            // validate ownerId
            if (!mongoose.Types.ObjectId.isValid(ownerId)) {
                return res.status(400).json({ success: false, message: 'Invalid ownerId' });
            }
            filter.ownerId = ownerId;
        }

        // Exclude images field to reduce payload size (images bloat response with base64)
        const products = await Product.find(filter).select('-images').lean();
        return res.json({ success: true, data: products });
    } catch (err) {
        console.error('getAllProducts error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllProductsWithImages = async (req, res) => {
    try {
        const { ownerId } = req.query || {};

        let filter = {};
        if (ownerId) {
            // validate ownerId
            if (!mongoose.Types.ObjectId.isValid(ownerId)) {
                return res.status(400).json({ success: false, message: 'Invalid ownerId' });
            }
            filter.ownerId = ownerId;
        }

        // Include images (for customer pages that need them)
        const products = await Product.find(filter).lean();
        return res.json({ success: true, data: products });
    } catch (err) {
        console.error('getAllProductsWithImages error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const result = await Product.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        return res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        console.error('deleteProduct error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const { name, description, price, mrp, stock, inStock, sku, category, isActive, isFeatured, images } = req.body;

        const update = {};
        if (name !== undefined) update.name = name;
        if (description !== undefined) update.description = description;
        if (price !== undefined) update.price = Number(price);
        if (mrp !== undefined) update.mrp = Number(mrp);
        if (stock !== undefined) update.stock = Number(stock);
        if (inStock !== undefined) update.inStock = !!inStock;
        if (sku !== undefined) update.sku = sku;
        if (category !== undefined) update.category = category;
        if (isActive !== undefined) update.isActive = !!isActive;
        if (isFeatured !== undefined) update.isFeatured = !!isFeatured;
        if (images !== undefined && Array.isArray(images)) update.images = images;

        const updated = await Product.findByIdAndUpdate(id, update, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });

        return res.json({ success: true, message: 'Product updated', data: updated });
    } catch (err) {
        console.error('updateProduct error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getFollowedShopsProducts = async (req, res) => {
    try {
        const { customerId } = req.query;

        if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ success: false, message: 'Valid customerId is required' });
        }

        const Customer = require('../models/Customer');

        // Get customer's following list
        const customer = await Customer.findById(customerId).select('following').lean();
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const followingIds = customer.following || [];
        if (followingIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Get products from followed shops
        const products = await Product.find({
            ownerId: { $in: followingIds },
            isActive: true
        }).lean();

        return res.json({ success: true, data: products });
    } catch (err) {
        console.error('getFollowedShopsProducts error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const product = await Product.findById(id).lean();
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        return res.json({ success: true, data: product });
    } catch (err) {
        console.error('getProductById error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getProductImages = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const product = await Product.findById(id).select('images').lean();
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        return res.json({ success: true, data: product.images || [] });
    } catch (err) {
        console.error('getProductImages error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.searchProducts = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Search in product name, description, and category using regex for case-insensitive search
        const searchQuery = {
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ]
        };

        const products = await Product.find(searchQuery)
            // include fields needed by client; ownerId is required to fetch shop/products
            .select('name description price mrp category images inStock ownerId')
            .limit(50)
            .lean();

        return res.json({ success: true, data: products });
    } catch (err) {
        console.error('searchProducts error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
