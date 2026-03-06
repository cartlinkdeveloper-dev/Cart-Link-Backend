const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const sessionMiddleware = require('../middleware/sessionMiddleware');

// Auth endpoints
router.post('/register', authController.register);
router.post('/verify-credentials', authController.verifyCredentials);
router.get('/check-mobile/:mobile', authController.checkMobileExists);
router.get('/check-email/:email', authController.checkEmailExists);
router.post('/logout', authController.logout);
router.get('/session', sessionMiddleware.getSessionInfo);

// OTP endpoints
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

// Forgot Password endpoints
router.post('/forgot-password/verify', authController.forgotPasswordVerify);
router.post('/forgot-password/resend-otp', authController.forgotPasswordResendOTP);
router.post('/change-password', authController.changePassword);

module.exports = router;