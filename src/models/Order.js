const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customers',
        required: true,
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            price: {
                type: Number,
                required: true,
            },
            mrp: {
                type: Number,
            },
        },
    ],
    cancelledProducts: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            productName: String,
            quantity: Number,
            price: Number,
            cancelledAt: {
                type: Date,
                default: Date.now,
            },
            customerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Customers',
            },
        },
    ],
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'ready_for_delivery', 'completed', 'cancelled'],
        default: 'pending',
    },
    deliveryOtp: {
        type: String,
        default: null,
    },
    deliveryAddress: {
        type: String,
        default: '',
    },
    deliveryLocation: {
        lat: { type: Number },
        lng: { type: Number },
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { collection: 'orders' });

module.exports = mongoose.model('Order', OrderSchema);
