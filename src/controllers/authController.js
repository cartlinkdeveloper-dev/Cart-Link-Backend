const jwt = require('jsonwebtoken');
const ShopOwner = require('../models/ShopOwner');
require('dotenv').config();

const signToken = (shop) => {
    return jwt.sign({ shopId: shop._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
    try {
        const { shopName, ownerName, mobile, email, password, businessType, address, taxId } = req.body;

        // Validate required fields
        if (!shopName || !ownerName || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: 'shopName, ownerName, mobile, and password are required'
            });
        }

        // Validate mobile format
        if (mobile.length < 7) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number format'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Check if mobile already exists
        const existingMobile = await ShopOwner.findOne({ mobile });
        if (existingMobile) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number already registered'
            });
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await ShopOwner.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
        }

        // Create new shop owner
        const owner = new ShopOwner({
            shopName,
            ownerName,
            mobile,
            email,
            password,
            businessType,
            address,
            taxId,
            balance: 0
        });

        await owner.save();
        console.log('✓ New shop registered:', shopName);

        const token = signToken(owner);

        // Store user session
        req.session.userId = owner._id;
        req.session.userType = 'shop';
        req.session.shopName = owner.shopName;

        res.status(201).json({
            success: true,
            message: 'Shop registered successfully',
            token,
            owner: {
                _id: owner._id,
                shopName: owner.shopName,
                ownerName: owner.ownerName,
                mobile: owner.mobile,
                email: owner.email,
                businessType: owner.businessType,
                address: owner.address
            }
        });
    } catch (e) {
        console.error('Register error:', e);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

exports.verifyCredentials = async (req, res) => {
    try {
        const { mobile, password } = req.body;

        if (!mobile || !password) {
            return res.status(400).json({
                success: false,
                message: 'mobile and password are required'
            });
        }

        // Find shop owner by mobile
        const owner = await ShopOwner.findOne({ mobile });

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: 'Account not found for this mobile number'
            });
        }

        // Compare password using bcrypt
        const isValid = await owner.comparePassword(password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Generate token
        const token = signToken(owner);

        // Store user session
        req.session.userId = owner._id;
        req.session.userType = 'shop';
        req.session.shopName = owner.shopName;

        res.json({
            success: true,
            message: 'Login successful',
            token,
            owner: {
                _id: owner._id,
                shopName: owner.shopName,
                ownerName: owner.ownerName,
                mobile: owner.mobile,
                email: owner.email,
                businessType: owner.businessType,
                address: owner.address,
                balance: owner.balance
            }
        });
    } catch (e) {
        console.error('Verify credentials error:', e);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

exports.checkMobileExists = async (req, res) => {
    try {
        const { mobile } = req.params;

        if (!mobile || mobile.length < 7) {
            return res.status(400).json({
                success: false,
                exists: false,
                message: 'Invalid mobile number'
            });
        }

        const owner = await ShopOwner.findOne({ mobile });

        if (!owner) {
            return res.json({
                success: true,
                exists: false,
                message: `Mobile ${mobile} is available`
            });
        }

        res.json({
            success: true,
            exists: true,
            message: `Mobile ${mobile} is already registered`
        });
    } catch (e) {
        console.error('Check mobile error:', e);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.checkEmailExists = async (req, res) => {
    try {
        const { email } = req.params;

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                exists: false,
                message: 'Invalid email'
            });
        }

        const owner = await ShopOwner.findOne({ email });

        if (!owner) {
            return res.json({
                success: true,
                exists: false,
                message: `Email ${email} is available`
            });
        }

        res.json({
            success: true,
            exists: true,
            message: `Email ${email} is already registered`
        });
    } catch (e) {
        console.error('Check email error:', e);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Logout endpoint
exports.logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to logout'
                });
            }

            res.clearCookie('connect.sid');
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        });
    } catch (e) {
        console.error('Logout error:', e);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
};