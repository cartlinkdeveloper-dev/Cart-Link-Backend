const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Review = require('../models/Review');

// Get recent activities (truly the latest data chronologically)
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = [];

    // Calculate how many items to fetch from each collection
    // Fetch more items than needed, then sort chronologically to get true latest
    const fetchLimit = Math.ceil(limit * 1.5) + 5; // Fetch extra to ensure we get enough after sorting

    // Fetch recent shops
    const recentShops = await Shop.find()
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .select('shopName createdAt _id')
      .lean();

    recentShops.forEach((shop) => {
      activities.push({
        type: 'shop',
        title: 'New Shop Registration',
        description: `${shop.shopName || 'New Shop'} registered`,
        timestamp: shop.createdAt,
        id: shop._id,
      });
    });

    // Fetch recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .select('totalAmount createdAt _id')
      .lean();

    recentOrders.forEach((order) => {
      const amount = order.totalAmount ? `$${order.totalAmount.toFixed(2)}` : 'order';
      activities.push({
        type: 'order',
        title: 'Order Placed',
        description: `Order #${order._id.toString().slice(-6).toUpperCase()} - ${amount}`,
        timestamp: order.createdAt,
        id: order._id,
      });
    });

    // Fetch recent customers
    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .select('firstName createdAt _id')
      .lean();

    recentCustomers.forEach((customer) => {
      activities.push({
        type: 'user',
        title: 'New User Joined',
        description: `${customer.firstName || 'Customer'} signed up`,
        timestamp: customer.createdAt,
        id: customer._id,
      });
    });

    // Fetch recent products
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .select('name createdAt _id')
      .lean();

    recentProducts.forEach((product) => {
      activities.push({
        type: 'product',
        title: 'New Product Added',
        description: `${product.name || 'Product'} added`,
        timestamp: product.createdAt,
        id: product._id,
      });
    });

    // Fetch recent reviews
    const recentReviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .select('rating createdAt _id')
      .lean();

    recentReviews.forEach((review) => {
      activities.push({
        type: 'review',
        title: 'New Review',
        description: `${review.rating || 5}-star review posted`,
        timestamp: review.createdAt,
        id: review._id,
      });
    });

    // Remove duplicates by ID
    const uniqueActivities = [];
    const seenIds = new Set();
    
    activities.forEach((activity) => {
      const uniqueKey = `${activity.type}-${activity.id}`;
      if (!seenIds.has(uniqueKey)) {
        seenIds.add(uniqueKey);
        uniqueActivities.push(activity);
      }
    });

    // Sort by timestamp descending (most recent first) and limit to requested amount
    const sortedActivities = uniqueActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json(sortedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      message: 'Error fetching activities',
      error: error.message,
    });
  }
});

// Get activities by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    let activities = [];

    switch (type.toLowerCase()) {
      case 'orders':
        const orders = await Order.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        activities = orders.map((order) => ({
          type: 'order',
          title: 'Order Placed',
          description: `Order #${order._id.toString().slice(-6).toUpperCase()}`,
          timestamp: order.createdAt,
          id: order._id,
        }));
        break;

      case 'shops':
        const shops = await Shop.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        activities = shops.map((shop) => ({
          type: 'shop',
          title: 'Shop Registration',
          description: shop.shopName || 'New Shop',
          timestamp: shop.createdAt,
          id: shop._id,
        }));
        break;

      case 'users':
        const customers = await Customer.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        activities = customers.map((customer) => ({
          type: 'user',
          title: 'New User',
          description: customer.firstName || 'Customer',
          timestamp: customer.createdAt,
          id: customer._id,
        }));
        break;

      case 'products':
        const products = await Product.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        activities = products.map((product) => ({
          type: 'product',
          title: 'Product Added',
          description: product.name || 'Product',
          timestamp: product.createdAt,
          id: product._id,
        }));
        break;

      default:
        return res.status(400).json({ message: 'Invalid activity type' });
    }

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities by type:', error);
    res.status(500).json({
      message: 'Error fetching activities',
      error: error.message,
    });
  }
});

module.exports = router;
