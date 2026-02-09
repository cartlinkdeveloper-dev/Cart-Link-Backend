const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

router.post('/upload', uploadController.uploadImage);
router.post('/delete', uploadController.deleteImage);

module.exports = router;
