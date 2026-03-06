const mongoose = require('mongoose');

const EndedOfferSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  offerPrice: { type: Number, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  endedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EndedOffer', EndedOfferSchema);
