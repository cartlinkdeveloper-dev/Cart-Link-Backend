const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');
require('dotenv').config();

const signToken = (customer) => {
    return jwt.sign({ customerId: customer._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
    try {
        const { customerName, mobile, email, password } = req.body;

        // Validate required fields
        if (!customerName || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, mobile, and password are required'
            });
        }

        // Validate mobile format
        if (mobile.toString().length < 7) {
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
        const existingMobile = await Customer.findOne({ mobile });
        if (existingMobile) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number already registered'
            });
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await Customer.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create new customer (not verified yet)
        const customer = new Customer({
            customerName,
            mobile: Number(mobile),
            email: email ? email.toLowerCase() : undefined,
            password,
            isEmailVerified: false,
            otp,
            otpExpiry,
        });

        await customer.save();
        console.log('✓ New Customer registered (pending verification):', customerName);

        // create customer with email already verified
        const token = signToken(customer);
        res.status(201).json({
            success: true,
            message: 'Customer registered successfully.',
            token,
            customer: {
                _id: customer._id,
                customerName: customer.customerName,
                email: customer.email,
                mobile: customer.mobile
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

        // Convert mobile to number for consistent matching
        const mobileNum = Number(mobile);

        // Find customer by mobile
        const customer = await Customer.findOne({ mobile: mobileNum });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Account not found for this mobile number'
            });
        }

        // Compare password using bcrypt
        const isValid = await customer.comparePassword(password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Password OK – just log in, ignore OTP entirely
        const token = signToken(customer);

        // Store user session
        req.session.userId = customer._id;
        req.session.userType = 'customer';
        req.session.customerName = customer.customerName;

        res.json({
            success: true,
            message: 'Login successful',
            token,
            owner: {
                _id: customer._id,
                customerName: customer.customerName,
                mobile: customer.mobile,
                email: customer.email,
                address: customer.location,
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

// Save or update FCM token for a customer. Mobile client calls this after retrieving the token from FirebaseMessaging.
exports.updateFcmToken = async (req, res) => {
    try {
        const { id } = req.params;
        const { fcmToken } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid customer ID' });
        }

        await Customer.findByIdAndUpdate(id, { fcmToken });
        return res.json({ success: true });
    } catch (err) {
        console.error('updateFcmToken error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        customer.otp = otp;
        customer.otpExpiry = otpExpiry;
        await customer.save();

        // Send OTP email in background (non-blocking)
        if (customer.email) {
            sendOTPEmail(customer.email, otp, customer.customerName)
                .then(() => console.log('✓ OTP resent to:', customer.email))
                .catch(err => console.error('✗ Failed to send OTP email:', err.message));
        }

        res.json({
            success: true,
            message: 'OTP sent successfully to your email'
        });
    } catch (e) {
        console.error('Resend OTP error:', e);
        res.status(500).json({
            success: false,
            message: 'Server error while resending OTP'
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

        // Convert mobile to number for consistent matching
        const mobileNum = Number(mobile);

        const customer = await Customer.findOne({ mobile: mobileNum });

        if (!customer) {
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

        const customer = await Customer.findOne({ email });

        if (!customer) {
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

// List all customers (public)
exports.listAll = async (req, res) => {
    try {
        const customers = await Customer.find().lean();
        console.log('Customers listed:', customers);
        return res.json({ success: true, data: customers });

    } catch (err) {
        console.error('listAll error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Follow/Unfollow shop
exports.followShop = async (req, res) => {
    try {
        const { shopId, isFollowing, customerId } = req.body;

        console.log('[FOLLOW SHOP] Request received:', { shopId, isFollowing, customerId });

        if (!shopId) {
            return res.status(400).json({
                success: false,
                message: 'Shop ID is required'
            });
        }

        const cId = customerId;

        if (!cId) {
            console.error('[FOLLOW SHOP] Customer ID missing');
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        const Shop = require('../models/Shop');

        if (isFollowing) {
            // Add shop to customer's following list
            const updatedCustomer = await Customer.findByIdAndUpdate(
                cId,
                { $addToSet: { following: shopId } },
                { new: true }
            );

            console.log('[FOLLOW SHOP] Updated customer:', updatedCustomer);

            // Add customer to shop's followers list
            const updatedShop = await Shop.findByIdAndUpdate(
                shopId,
                { $addToSet: { followers: cId } },
                { new: true }
            );

            console.log('[FOLLOW SHOP] Updated shop:', updatedShop);

            return res.status(200).json({
                success: true,
                message: 'Shop followed successfully',
                data: { customer: updatedCustomer, shop: updatedShop }
            });
        } else {
            // Remove shop from customer's following list
            const updatedCustomer = await Customer.findByIdAndUpdate(
                cId,
                { $pull: { following: shopId } },
                { new: true }
            );

            console.log('[FOLLOW SHOP] Updated customer (unfollow):', updatedCustomer);

            // Remove customer from shop's followers list
            const updatedShop = await Shop.findByIdAndUpdate(
                shopId,
                { $pull: { followers: cId } },
                { new: true }
            );

            console.log('[FOLLOW SHOP] Updated shop (unfollow):', updatedShop);

            return res.status(200).json({
                success: true,
                message: 'Shop unfollowed successfully',
                data: { customer: updatedCustomer, shop: updatedShop }
            });
        }
    } catch (err) {
        console.error('Follow shop error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get followed shops for a customer
exports.getFollowing = async (req, res) => {
    try {
        const customerId = req.params.id || req.query.customerId || null;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        const Shop = require('../models/Shop');

        const customer = await Customer.findById(customerId).lean();
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const followingIds = customer.following || [];

        const shops = await Shop.find({ _id: { $in: followingIds } }).lean();

        return res.status(200).json({
            success: true,
            data: {
                following: followingIds,
                shops
            }
        });
    } catch (err) {
        console.error('Get following error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update customer profile
exports.updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { customerName, email, address, mobile, notificationsEnabled, orderUpdatesEnabled, offersEnabled } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Update fields if provided
        if (customerName) customer.customerName = customerName;
        if (email) customer.email = email.toLowerCase();
        if (address) customer.address = address;
        if (mobile) customer.mobile = Number(mobile);
        if (notificationsEnabled !== undefined) customer.notificationsEnabled = notificationsEnabled;
        if (orderUpdatesEnabled !== undefined) customer.orderUpdatesEnabled = orderUpdatesEnabled;
        if (offersEnabled !== undefined) customer.offersEnabled = offersEnabled;

        await customer.save();

        console.log('✓ Customer profile updated:', id);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: customer
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error during profile update'
        });
    }
};

// ============================================
// FORGOT PASSWORD ENDPOINTS
// ============================================

/**
 * Verify mobile number and email match, then send OTP
 * POST /api/customer-auth/forgot-password/verify
 */
exports.forgotPasswordVerify = async (req, res) => {
    try {
        const { mobile, email } = req.body;

        // Validate input
        if (!mobile || !email) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number and email are required'
            });
        }

        // Find customer with matching mobile and email
        const customer = await Customer.findOne({
            mobile: parseInt(mobile),
            email: email.toLowerCase().trim()
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this mobile number and email combination'
            });
        }

        // verification succeeded, no OTP needed
        res.json({
            success: true,
            message: 'Verification successful. You may now reset your password.',
            customerId: customer._id,
            customerName: customer.customerName
        });

    } catch (error) {
        console.error('Forgot password verify error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Change customer password
 * POST /api/customer-auth/change-password
 */
exports.changePassword = async (req, res) => {
    try {
        const { customerId, newPassword } = req.body;

        // Validate input
        if (!customerId || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Find customer
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check if new password is same as old password
        const isSamePassword = await customer.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as your old password'
            });
        }

        // Update password (will be automatically hashed by pre-save hook)
        customer.password = newPassword;
        customer.otp = undefined; // Clear OTP
        customer.otpExpiry = undefined;
        await customer.save();

        console.log('✅ Password changed successfully for:', customer.customerName);

        // Generate JWT token
        const token = signToken(customer);

        // Store user session
        req.session.userId = customer._id;
        req.session.userType = 'customer';
        req.session.customerName = customer.customerName;

        res.json({
            success: true,
            message: 'Password changed successfully',
            customer: {
                _id: customer._id,
                customerName: customer.customerName,
                email: customer.email,
                mobile: customer.mobile
            },
            token
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

