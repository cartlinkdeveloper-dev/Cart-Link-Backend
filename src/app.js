const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
require('./config/database');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'cartlink-12345' // Replace with your actual project ID
    });
}
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const customerAuthRoutes = require('./routes/customerAuthRoutes');
const customersRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const compareRoutes = require('./routes/compareRoutes');
const orderRoutes = require('./routes/orderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const offerRoutes = require('./routes/offerRoutes');
const customerReportRoutes = require('./routes/customerReportRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const supportRoutes = require('./routes/supportRoutes');
const shopSupportRoutes = require('./routes/shopSupportRoutes');
const activityRoutes = require('./routes/activityRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure session middleware with MongoDB store for persistence
// Configure session middleware with MongoDB store for persistence.
// Use MongoStore.create with a `mongoUrl` so the store manages its own connection
// instead of depending on mongoose.connection.getClient(), which may be closed
// if the main connection fails.
const mongoUrl = process.env.MONGODB_URI || 'mongodb+srv://cartLink_mongodb:CartLink123@cartlink.edvcqv6.mongodb.net/Cart_Link?retryWrites=true&w=majority&appName=CartLink';

app.use(session({
    secret: process.env.SESSION_SECRET || 'cart-link-session-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl,
        touchAfter: 24 * 3600, // Update session once per 24 hours unless changed
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'lax'
    }
}));

// Set request timeout to 2 minutes
app.use((req, res, next) => {
    req.setTimeout(120000);
    res.setTimeout(120000);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/Shops', shopRoutes);
app.use('/api/customersAuth', customerAuthRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', customerReportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/shop-support', shopSupportRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend is running ✓', timestamp: new Date() });
});

module.exports = app;