const mongoose = require('mongoose');
const Compare = require('../models/Compare');
const Product = require('../models/Product');

// Get comparison list for a customer
exports.getCompareList = async (req, res) => {
    try {
        const { customerId } = req.query;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                error: 'customerId is required'
            });
        }

        let compareList = await Compare.findOne({ customerId });

        if (!compareList) {
            return res.json({
                items: []
            });
        }

        return res.json({
            items: compareList.items || []
        });
    } catch (error) {
        console.error('Get compare list error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Add product to comparison list
exports.addToCompare = async (req, res) => {
    try {
        const { customerId, productId, shopId } = req.body;

        // Validate required fields
        if (!customerId || !productId || !shopId) {
            return res.status(400).json({
                success: false,
                error: 'customerId, productId, and shopId are required'
            });
        }

        // Find or create comparison list
        let compareList = await Compare.findOne({ customerId });

        if (!compareList) {
            compareList = new Compare({
                customerId,
                items: []
            });
        }

        // Check if max limit (3 products) reached
        if (compareList.items.length >= 3) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 3 products can be compared at once'
            });
        }

        // Check if product already in list
        const exists = compareList.items.some(
            item => item.productId === productId.toString() && item.shopId === shopId.toString()
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                error: 'Product already in comparison'
            });
        }

        // Fetch product details
        let product = null;
        try {
            product = await Product.findOne({
                $or: [
                    { _id: productId },
                    { _id: mongoose.Types.ObjectId.isValid(productId) ? new mongoose.Types.ObjectId(productId) : null }
                ]
            });
        } catch (e) {
            // Product not found, but we can still add basic info
        }

        // Prepare product data for comparison
        const productData = {
            productId: productId.toString(),
            shopId: shopId.toString(),
            name: product?.name || product?.product || product?.productName || 'Unknown Product',
            shopName: product?.shopName || 'Unknown Shop',
            price: product?.offerPrice || product?.price || 0,
            offerPrice: product?.offerPrice || product?.price || 0,
            mrp: product?.mrp || 0,
            discount: product?.discount || 0,
            stock: product?.stock || 0,
            inStock: product?.inStock !== false
        };

        // Add product to comparison list
        compareList.items.push(productData);
        compareList.updatedAt = new Date();

        await compareList.save();

        return res.status(201).json({
            success: true,
            message: 'Product added to comparison',
            compareListLength: compareList.items.length
        });
    } catch (error) {
        console.error('Add to compare error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Remove product from comparison list
exports.removeFromCompare = async (req, res) => {
    try {
        const { productId } = req.params;
        const { customerId, shopId } = req.query;

        // Validate required fields
        if (!customerId || !shopId) {
            return res.status(400).json({
                success: false,
                error: 'customerId and shopId are required'
            });
        }

        // Find comparison list
        const compareList = await Compare.findOne({ customerId });

        if (!compareList) {
            return res.status(404).json({
                success: false,
                error: 'Comparison list not found'
            });
        }

        // Remove product from items array
        compareList.items = compareList.items.filter(
            item => !(
                item.productId === productId.toString() &&
                item.shopId === shopId.toString()
            )
        );

        compareList.updatedAt = new Date();
        await compareList.save();

        return res.json({
            success: true,
            message: 'Product removed from comparison',
            compareListLength: compareList.items.length
        });
    } catch (error) {
        console.error('Remove from compare error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Clear entire comparison list
exports.clearCompareList = async (req, res) => {
    try {
        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                error: 'customerId is required'
            });
        }

        await Compare.findOneAndDelete({ customerId });

        return res.json({
            success: true,
            message: 'Comparison list cleared'
        });
    } catch (error) {
        console.error('Clear compare list error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
