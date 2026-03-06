const mongoose = require('mongoose');
const Offer = require('../models/Offer');
const EndedOffer = require('../models/EndedOffer');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const Shop = require('../models/Shop');
const Customer = require('../models/Customer');

// firebase admin for push notifications
const admin = require('firebase-admin');

async function _sendFcm(tokens, payload) {
    if (!tokens || tokens.length === 0) return;
    try {
        const message = {
            tokens,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data ?? {},
        };
        const resp = await admin.messaging().sendMulticast(message);
        console.log('[FirebaseAdmin] sent multicast, success:', resp.successCount, 'failure:', resp.failureCount);
    } catch (e) {
        console.error('[FirebaseAdmin] send error in offerController:', e);
    }
}


exports.createOffer = async (req, res) => {
  try {
    const { ownerId, productNames, offerPrice, startDateTime, endDateTime, discountPercentage } = req.body;

    // Validate required fields
    if (!ownerId || !productNames || !Array.isArray(productNames) || productNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: ownerId, productNames (array)'
      });
    }

    if (offerPrice == null || offerPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Offer price must be greater than 0'
      });
    }

    if (!startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Start and end date/time are required'
      });
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Validate ownerId
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ownerId'
      });
    }

    // Find products by name and ownerId
    const products = await Product.find({
      name: { $in: productNames },
      ownerId: ownerId
    }).select('_id name price');

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found matching the provided names'
      });
    }

    const productIds = products.map(p => p._id);

    // Create the offer
    const offer = new Offer({
      ownerId,
      productIds,
      offerPrice: Number(offerPrice),
      startDateTime: start,
      endDateTime: end,
      discountPercentage: discountPercentage != null ? Number(discountPercentage) : 0
    });

    await offer.save();

    // Update products with offer details
    await Product.updateMany(
      { _id: { $in: productIds } },
      {
        offerPrice: Number(offerPrice),
        offerStart: start,
        offerEnd: end,
        offerActive: true
      }
    );

    // Send notifications to followers
    try {
      const shop = await Shop.findById(ownerId).select('followers shopName').lean();
      if (shop && shop.followers && shop.followers.length > 0) {
        const offerDescription = products.length === 1
          ? `${products[0].name}`
          : `${products.length} products`;

        const notifications = shop.followers.map(followerId => ({
          customerId: followerId,
          title: 'Special Offer Available',
          message: `Check out our special offer on ${offerDescription}! Price: ₹${offerPrice}`,
          type: 'offer',
          data: {
            offerId: offer._id,
            shopId: ownerId,
            productIds: productIds,
            offerPrice: offerPrice
          }
        }));

        await Notification.insertMany(notifications);
        console.log(`Sent ${notifications.length} offer notifications`);

        // push via FCM to customers who have tokens
        const customers = await Customer.find({
          _id: { $in: shop.followers },
          fcmToken: { $exists: true, $ne: '' }
        }).select('fcmToken').lean();
        const tokens = customers.map(c => c.fcmToken).filter(Boolean);
        await _sendFcm(tokens, {
          title: 'Special Offer Available',
          body: `Check out our special offer on ${offerDescription}!`,
          data: { offerId: offer._id.toString(), shopId: ownerId.toString() }
        });
      }
    } catch (notifErr) {
      console.error('Error sending notifications:', notifErr);
      // Don't fail the offer creation if notifications fail
    }

    return res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: offer
    });
  } catch (err) {
    console.error('createOffer error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

exports.getOffersByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ownerId'
      });
    }

    const offers = await Offer.find({ ownerId })
      .populate('productIds', 'name price mrp')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: offers
    });
  } catch (err) {
    console.error('getOffersByOwner error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getActiveOffers = async (req, res) => {
  try {
    const now = new Date();

    const offers = await Offer.find({
      startDateTime: { $lte: now },
      endDateTime: { $gte: now },
      isActive: true
    })
      .populate('ownerId', 'shopName')
      .populate('productIds', 'name price offerPrice image')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: offers
    });
  } catch (err) {
    console.error('getActiveOffers error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { offerPrice, startDateTime, endDateTime, isActive, discountPercentage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid offerId'
      });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // Update fields if provided
    if (offerPrice != null && offerPrice > 0) {
      offer.offerPrice = Number(offerPrice);
      // Update all associated products
      await Product.updateMany(
        { _id: { $in: offer.productIds } },
        { offerPrice: Number(offerPrice) }
      );
    }
    if (discountPercentage != null) {
      offer.discountPercentage = Number(discountPercentage);
    }

    if (startDateTime) {
      offer.startDateTime = new Date(startDateTime);
    }

    if (endDateTime) {
      offer.endDateTime = new Date(endDateTime);
    }

    if (isActive != null) {
      offer.isActive = !!isActive;
    }

    // If offer has ended or been deactivated, archive it
    const now = new Date();
    const willBeEnded = (!offer.isActive) ||
      (offer.endDateTime && offer.endDateTime < now);
    if (willBeEnded) {
      await archiveOffer(offer);
      await Offer.findByIdAndDelete(offerId);
      // also clear products
      await Product.updateMany(
        { _id: { $in: offer.productIds } },
        {
          offerPrice: null,
          offerStart: null,
          offerEnd: null,
          offerActive: false
        }
      );
      return res.json({
        success: true,
        message: 'Offer archived and removed',
        data: offer
      });
    }

    offer.updatedAt = new Date();
    await offer.save();

    return res.json({
      success: true,
      message: 'Offer updated successfully',
      data: offer
    });
  } catch (err) {
    console.error('updateOffer error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// helper to archive an offer
async function archiveOffer(offer) {
  if (!offer) return;
  try {
    const obj = offer.toObject ? offer.toObject() : offer;
    obj.endedAt = new Date();
    // remove _id so mongoose will generate a new one
    delete obj._id;
    await EndedOffer.create(obj);
  } catch (e) {
    console.error('archiveOffer error', e);
  }
}

exports.deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid offerId'
      });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // archive before removal
    await archiveOffer(offer);

    await Offer.findByIdAndDelete(offerId);

    // Remove offer details from products
    await Product.updateMany(
      { _id: { $in: offer.productIds } },
      {
        offerPrice: null,
        offerStart: null,
        offerEnd: null,
        offerActive: false
      }
    );

    return res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (err) {
    console.error('deleteOffer error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getEndedOffersByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ownerId'
      });
    }

    const endedOffers = await EndedOffer.find({ ownerId })
      .populate('productIds', 'name price mrp')
      .sort({ endedAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: endedOffers
    });
  } catch (err) {
    console.error('getEndedOffersByOwner error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.deleteEndedOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid offerId'
      });
    }

    const deletedOffer = await EndedOffer.findByIdAndDelete(offerId);
    if (!deletedOffer) {
      return res.status(404).json({
        success: false,
        message: 'Ended offer not found'
      });
    }

    return res.json({
      success: true,
      message: 'Ended offer deleted successfully'
    });
  } catch (err) {
    console.error('deleteEndedOffer error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
