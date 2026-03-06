const mongoose = require('mongoose');
const Review = require('../models/Review');

// add a new review or update if exists
exports.createReview = async (req, res) => {
  try {
    const { customerId, productId, shopId, orderId, rating, comment, images } = req.body;
    // either a productId or shopId (or both) must be provided
    if (!customerId || !rating || (!productId && !shopId)) {
      return res.status(400).json({
        success: false,
        message: 'customerId, rating and at least one of productId or shopId are required',
      });
    }

    // Check if review already exists
    const query = { customerId, orderId };
    if (productId) query.productId = productId;
    if (shopId && !productId) query.shopId = shopId;

    let review = await Review.findOne(query);
    
    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment || '';
      if (images && Array.isArray(images)) {
        review.images = images;
      }
      review.updatedAt = new Date();
      await review.save();
      return res.status(200).json({ success: true, data: review, isUpdate: true });
    }

    // Create new review
    const newReview = new Review({
      customerId,
      productId: productId || null,
      shopId,
      orderId,
      rating,
      comment: comment || '',
      images: (images && Array.isArray(images)) ? images : [],
    });
    await newReview.save();

    // If this review is for a shop, update its embedded ratings/averages
    if (shopId && mongoose.Types.ObjectId.isValid(shopId)) {
      const shop = await require('../models/Shop').findById(shopId);
      if (shop) {
        // push into ratings array
        shop.ratings.push({ customerId, rating, comment });
        const oldCount = shop.ratingCount || 0;
        const oldAvg = shop.avgRating || 0;
        const newCount = oldCount + 1;
        shop.ratingCount = newCount;
        shop.avgRating = ((oldAvg * oldCount) + rating) / newCount;
        await shop.save();
      }
    }

    return res.status(201).json({ success: true, data: newReview, isUpdate: false });
  } catch (err) {
    console.error('createReview error:', err);
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this item. Use the edit option to update your review.',
      });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// fetch reviews optionally filtered by product or shop
exports.getReviews = async (req, res) => {
  try {
    const { productId, shopId, orderId, customerId } = req.query;
    const filter = {};
    if (productId && mongoose.Types.ObjectId.isValid(productId)) filter.productId = productId;
    if (shopId && mongoose.Types.ObjectId.isValid(shopId)) filter.shopId = shopId;
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) filter.orderId = orderId;
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) filter.customerId = customerId;

    const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('getReviews error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// check if user has already reviewed a product
exports.checkReviewExists = async (req, res) => {
  try {
    const { customerId, productId, orderId, shopId } = req.query;
    if (!customerId || !orderId || (!productId && !shopId)) {
      return res.status(400).json({
        success: false,
        message: 'customerId, orderId and either productId or shopId are required',
      });
    }

    const query = { customerId, orderId };
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query.productId = productId;
    } else if (shopId && mongoose.Types.ObjectId.isValid(shopId)) {
      query.shopId = shopId;
      query.productId = { $exists: false };
    }

    const review = await Review.findOne(query).lean();
    return res.json({
      success: true,
      exists: !!review,
      data: review || null,
    });
  } catch (err) {
    console.error('checkReviewExists error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// update an existing review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID',
      });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        rating,
        comment: comment || '',
        images: (images && Array.isArray(images)) ? images : [],
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    return res.json({ success: true, data: review });
  } catch (err) {
    console.error('updateReview error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID',
      });
    }

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    return res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('deleteReview error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};