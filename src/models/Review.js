const mongoose = require('mongoose');

// Customer reviews for products or shops.
const ReviewSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers', required: true },
  // productId is optional – reviews may apply to shops only
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Orders' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  images: [{ type: String }], // Array of image URLs
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'reviews' });

// Index to prevent duplicate reviews (one per user per product per order)
ReviewSchema.index({ customerId: 1, productId: 1, orderId: 1 }, { unique: true, sparse: true });
// Index for shop reviews (one per user per shop per order)
ReviewSchema.index({ customerId: 1, shopId: 1, orderId: 1, productId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', ReviewSchema);
