const jwt = require('jsonwebtoken');
const ShopOwner = require('../models/ShopOwner');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');
require('dotenv').config();

const signToken = (shop) => {
    return jwt.sign({ shopId: shop._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
    try {
        const { shopName, ownerName, mobile, email, password, businessType, address, taxId, latitude, longitude } = req.body;

        console.log('📝 Signup attempt:', {
            shopName,
            ownerName,
            mobile: mobile?.toString(),
            mobileLength: mobile?.toString().length,
            email,
            password: '***',
            businessType,
            address,
            taxId
        });

        // Validate required fields
        if (!shopName || !ownerName || !mobile || !password) {
            console.error('❌ Missing required fields:', {
                shopName: !!shopName,
                ownerName: !!ownerName,
                mobile: !!mobile,
                password: !!password
            });
            return res.status(400).json({
                success: false,
                message: 'shopName, ownerName, mobile, and password are required'
            });
        }

        const mobileStr = mobile.toString().trim();

        // Validate mobile format
        if (mobileStr.length < 7) {
            console.error('❌ Mobile too short:', mobileStr, 'length:', mobileStr.length);
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number format (minimum 7 digits)'
            });
        }

        // Validate password length
        if (password.length < 6) {
            console.error('❌ Password too short:', password.length);
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Check if mobile already exists
        const existingMobile = await ShopOwner.findOne({ mobile: mobileStr });
        if (existingMobile) {
            console.error('❌ Mobile already registered:', mobileStr);
            return res.status(400).json({
                success: false,
                message: 'Mobile number already registered'
            });
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await ShopOwner.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                console.error('❌ Email already registered:', email);
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
        }

        // Create new shop owner; email is considered verified immediately when removing OTP flow
        const owner = new ShopOwner({
            shopName,
            ownerName,
            mobile: Number(mobileStr),
            email: email.toLowerCase(),
            password,
            businessType,
            address,
            taxId,
            latitude,
            longitude,
            balance: 0,
            isEmailVerified: true // immediately verified
        });

        await owner.save();
        console.log('✓ New shop registered:', shopName);

        // Issue JWT token so frontend can log user in directly
        const token = signToken(owner);

        res.status(201).json({
            success: true,
            message: 'Shop registered successfully.',
            token,
            owner: {
                _id: owner._id,
                shopName: owner.shopName,
                email: owner.email,
                mobile: owner.mobile
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

        // Find shop owner by mobile
        const owner = await ShopOwner.findOne({ mobile: mobileNum });

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: 'Account not found for this mobile number'
            });
        }

        // Compare password using bcrypt (check password FIRST)
        const isValid = await owner.comparePassword(password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Password is valid – skip OTP entirely and issue token
        const token = signToken(owner);
        return res.status(200).json({
            success: true,
            token,
            owner: {
                _id: owner._id,
                shopName: owner.shopName,
                email: owner.email,
                mobile: owner.mobile
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

        // Convert mobile to number for consistent matching
        const mobileNum = Number(mobile);

        const owner = await ShopOwner.findOne({ mobile: mobileNum });

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


                mobile: owner.mobile,
                email: owner.email,
                businessType: owner.businessType,
                address: owner.address,
                balance: owner.balance
            }
        });
    } catch (e) {
        console.error('Verify OTP error:', e);
        res.status(500).json({
            success: false,
            message: 'Server error during OTP verification'
        });
    }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
    try {
        const { ownerId } = req.body;

        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: 'Owner ID is required'
            });
        }

        const owner = await ShopOwner.findById(ownerId);

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        owner.otp = otp;
        owner.otpExpiry = otpExpiry;
        await owner.save();

        // Send OTP email in background (non-blocking)
        sendOTPEmail(owner.email, otp, owner.shopName)
            .then(() => console.log('✓ OTP resent to:', owner.email))
            .catch(err => console.error('✗ Failed to send OTP email:', err.message));

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

// ============================================
// FORGOT PASSWORD ENDPOINTS
// ============================================

/**
 * Verify mobile number and email match, then send OTP
 * POST /api/auth/forgot-password/verify
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

        // Find owner with matching mobile and email
        const owner = await ShopOwner.findOne({
            mobile: parseInt(mobile),
            email: email.toLowerCase().trim()
        });

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this mobile number and email combination'
            });
        }

        // no OTP required; directly proceed to password reset
        res.json({
            success: true,
            message: 'Verification successful. You may now reset your password.',
            ownerId: owner._id,
            shopName: owner.shopName
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
 * Resend OTP for forgot password flow
 * POST /api/auth/forgot-password/resend-otp
 */


/**
 * Change shop password
 * POST /api/auth/change-password
 */
exports.changePassword = async (req, res) => {
    try {
        const { ownerId, newPassword } = req.body;

        // Validate input
        if (!ownerId || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Owner ID and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Find owner
        const owner = await ShopOwner.findById(ownerId);
        if (!owner) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Check if new password is same as old password
        const isSamePassword = await owner.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as your old password'
            });
        }

        // Update password (will be automatically hashed by pre-save hook)
        owner.password = newPassword;
        owner.otp = undefined; // Clear OTP
        owner.otpExpiry = undefined;
        await owner.save();

        console.log('✅ Password changed successfully for:', owner.shopName);

        // Generate JWT token
        const token = signToken(owner);

        // Store user session
        req.session.userId = owner._id;
        req.session.userType = 'shop';
        req.session.shopName = owner.shopName;

        res.json({
            success: true,
            message: 'Password changed successfully',
            owner: {
                _id: owner._id,
                shopName: owner.shopName,
                ownerName: owner.ownerName,
                mobile: owner.mobile,
                email: owner.email
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