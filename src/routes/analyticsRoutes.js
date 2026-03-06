const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Review = require('../models/Review');

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total stats
    const totalOrders = await Order.countDocuments();
    const totalShops = await Shop.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await Customer.countDocuments();

    // Recent stats (last 30 days)
    const recentOrders = await Order.find({ createdAt: { $gte: thirtyDaysAgo } }).lean();
    const recentShops = await Shop.find({ createdAt: { $gte: thirtyDaysAgo } }).lean();
    const recentCustomers = await Customer.find({ createdAt: { $gte: thirtyDaysAgo } }).lean();

    // Revenue calculations
    const totalRevenue = recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrderValue = recentOrders.length > 0 ? (totalRevenue / recentOrders.length).toFixed(2) : 0;

    // Get top products
    const topProducts = await Product.find()
      .sort({ sales: -1 })
      .limit(5)
      .select('name sales category price')
      .lean();

    // Get top shops
    const topShops = await Shop.find()
      .sort({ rating: -1 })
      .limit(5)
      .select('shopName rating totalOrders')
      .lean();

    // Get average rating
    const reviews = await Review.find().lean();
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(2)
      : 0;

    // Orders by status
    const ordersByStatus = {};
    recentOrders.forEach((order) => {
      const status = order.status || 'Pending';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });

    res.json({
      totalStats: {
        totalOrders,
        totalShops,
        totalProducts,
        totalCustomers,
      },
      recentStats: {
        ordersLast30Days: recentOrders.length,
        shopsLast30Days: recentShops.length,
        customersLast30Days: recentCustomers.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue),
      },
      performance: {
        avgRating: parseFloat(avgRating),
        topProducts,
        topShops,
        ordersByStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      message: 'Error fetching analytics',
      error: error.message,
    });
  }
});

// Get sales trend (daily data for last 30 days)
router.get('/sales-trend', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await Order.find({ createdAt: { $gte: thirtyDaysAgo } }).lean();

    // Group by date
    const salesByDate = {};
    orders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      salesByDate[date] = (salesByDate[date] || 0) + (order.totalAmount || 0);
    });

    const trendData = Object.entries(salesByDate)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, amount]) => ({
        date,
        amount: parseFloat(amount.toFixed(2)),
      }));

    res.json(trendData);
  } catch (error) {
    console.error('Error fetching sales trend:', error);
    res.status(500).json({
      message: 'Error fetching sales trend',
      error: error.message,
    });
  }
});

// Get customer analytics
router.get('/customers', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalCustomers = await Customer.countDocuments();
    const newCustomers = await Customer.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    // Customer retention (repeat purchases)
    const repeatCustomers = await Order.aggregate([
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
        },
      },
      {
        $match: { orderCount: { $gt: 1 } },
      },
      {
        $count: 'count',
      },
    ]);

    const repeatCount = repeatCustomers[0]?.count || 0;
    const retentionRate = totalCustomers > 0 ? ((repeatCount / totalCustomers) * 100).toFixed(2) : 0;

    res.json({
      totalCustomers,
      newCustomersLast30Days: newCustomers,
      repeatCustomers: repeatCount,
      retentionRate: parseFloat(retentionRate),
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({
      message: 'Error fetching customer analytics',
      error: error.message,
    });
  }
});

// Get shop analytics
router.get('/shops', async (req, res) => {
  try {
    const shopAnalytics = await Shop.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'shopId',
          as: 'orders',
        },
      },
      {
        $project: {
          shopName: 1,
          rating: 1,
          totalOrders: { $size: '$orders' },
          revenue: {
            $sum: '$orders.totalAmount',
          },
        },
      },
      {
        $sort: { totalOrders: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.json(shopAnalytics);
  } catch (error) {
    console.error('Error fetching shop analytics:', error);
    res.status(500).json({
      message: 'Error fetching shop analytics',
      error: error.message,
    });
  }
});

module.exports = router;
