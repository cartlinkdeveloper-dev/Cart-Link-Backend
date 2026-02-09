const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const mongoose = require('mongoose');
require('./config/database');
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
app.use(session({
    secret: process.env.SESSION_SECRET || 'cart-link-session-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        client: mongoose.connection.getClient(),
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
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend is running ✓', timestamp: new Date() });
});

module.exports = app;