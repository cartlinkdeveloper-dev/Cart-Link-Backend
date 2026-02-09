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

module.exports = router;