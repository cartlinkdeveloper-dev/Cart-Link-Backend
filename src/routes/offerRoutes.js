const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');

// Create a new offer
router.post('/', offerController.createOffer);

// Get all offers for a specific shop owner
router.get('/owner/:ownerId', offerController.getOffersByOwner);

// Get all active offers (across all shops)
router.get('/active/all', offerController.getActiveOffers);

// Get all ended/archived offers for a specific shop owner
router.get('/ended/owner/:ownerId', offerController.getEndedOffersByOwner);

// Delete an ended/archived offer
router.delete('/ended/:offerId', offerController.deleteEndedOffer);

// Update an offer
router.put('/:offerId', offerController.updateOffer);

// Delete an offer
router.delete('/:offerId', offerController.deleteOffer);

module.exports = router;
