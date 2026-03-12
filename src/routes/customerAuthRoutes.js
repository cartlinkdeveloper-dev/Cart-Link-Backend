const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const sessionMiddleware = require('../middleware/sessionMiddleware');

// Auth endpoints
router.post('/register', customerController.register);
router.post('/verify-credentials', customerController.verifyCredentials);
router.get('/check-mobile/:mobile', customerController.checkMobileExists);
router.get('/check-email/:email', customerController.checkEmailExists);
router.post('/logout', customerController.logout);
router.get('/session', sessionMiddleware.getSessionInfo);

// OTP endpoints
router.post('/verify-otp', customerController.verifyOTP);
router.post('/resend-otp', customerController.resendOTP);

// Forgot Password endpoints
router.post('/forgot-password/verify', customerController.forgotPasswordVerify);
router.post('/forgot-password/resend-otp', customerController.forgotPasswordResendOTP);
router.post('/change-password', customerController.changePassword);

module.exports = router;