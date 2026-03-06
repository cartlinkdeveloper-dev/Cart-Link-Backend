const mongoose = require('mongoose');

const shopSupportSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    shopName: {
      type: String,
      required: true,
    },
    shopEmail: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['order', 'product', 'payment', 'delivery', 'account', 'other'],
      default: 'other',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    adminResponse: {
      type: String,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShopSupport', shopSupportSchema);
