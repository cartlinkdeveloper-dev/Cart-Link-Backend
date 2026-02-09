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

module.exports = router;