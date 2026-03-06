const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }],
  offerPrice: {
    type: Number,
    required: true
  },
  // percentage discount relative to average original price of products
  discountPercentage: {
    type: Number,
    default: 0
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'offers' });

module.exports = mongoose.model('Offer', OfferSchema);
