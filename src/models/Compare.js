const mongoose = require('mongoose');

const CompareSchema = new mongoose.Schema({
    // Customer who owns this comparison list
    customerId: {
        type: String,
        required: true,
        index: true
    },

    // Array of products in comparison (max 3)
    items: [
        {
            productId: String,
            shopId: String,
            name: String,
            shopName: String,
            price: Number,
            offerPrice: Number,
            mrp: Number,
            discount: Number,
            stock: Number,
            inStock: Boolean,
            addedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'compare' });

module.exports = mongoose.model('Compare', CompareSchema);
