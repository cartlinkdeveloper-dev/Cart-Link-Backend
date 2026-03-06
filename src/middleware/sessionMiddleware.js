// Middleware to check if user session exists
exports.requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
};

// Middleware to check if shop owner session exists
exports.requireShopAuth = (req, res, next) => {
    if (req.session && req.session.userId && req.session.userType === 'shop') {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Shop owner authentication required'
        });
    }
};

// Middleware to check if customer session exists
exports.requireCustomerAuth = (req, res, next) => {
    if (req.session && req.session.userId && req.session.userType === 'customer') {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Customer authentication required'
        });
    }
};

// Get current session info
exports.getSessionInfo = (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            success: true,
            loggedIn: true,
            userId: req.session.userId,
            userType: req.session.userType,
            shopName: req.session.shopName,
            customerName: req.session.customerName
        });
    } else {
        res.json({
            success: true,
            loggedIn: false
        });
    }
};
