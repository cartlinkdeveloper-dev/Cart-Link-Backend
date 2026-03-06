const express = require('express');
const router = express.Router();
const reviewCtrl = require('../controllers/reviewController');

router.post('/', reviewCtrl.createReview);
router.get('/', reviewCtrl.getReviews);
router.get('/check', reviewCtrl.checkReviewExists);
router.put('/:reviewId', reviewCtrl.updateReview);
router.delete('/:reviewId', reviewCtrl.deleteReview);

module.exports = router;
