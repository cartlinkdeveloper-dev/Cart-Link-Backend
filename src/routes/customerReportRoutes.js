const express = require('express');
const router = express.Router();
const reportCtrl = require('../controllers/customerReportController');

router.post('/', reportCtrl.submitReport);
router.get('/', reportCtrl.getReports);
router.patch('/:id/status', reportCtrl.updateStatus);

module.exports = router;
