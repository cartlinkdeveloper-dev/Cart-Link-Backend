const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  // For backwards compatibility we keep single-product fields, but
  // prefer using `items` for multiple products per cart (same shop).
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  quantity: { type: Number, default: 1 },

  // Owner of the cart (customer)
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers', required: false },

  // Shop for which the cart items belong
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: false },

  // New preferred structure: array of items with productId + quantity
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 },
    }
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'cart' });

module.exports = mongoose.model('Cart', CartSchema);
