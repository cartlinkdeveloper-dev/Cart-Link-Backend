const mongoose = require('mongoose');
const CustomerReport = require('../models/CustomerReport');

// submit a new customer report
exports.submitReport = async (req, res) => {
  try {
    const { reporterId, targetType, targetId, message } = req.body;
    if (!reporterId || !targetType || !targetId || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const report = new CustomerReport({ reporterId, targetType, targetId, message });
    await report.save();
    return res.status(201).json({ success: true, data: report });
  } catch (err) {
    console.error('submitReport error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// retrieve reports (optionally filtered by target or status)
exports.getReports = async (req, res) => {
  try {
    const { targetType, targetId, status } = req.query;
    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) filter.targetId = targetId;
    if (status) filter.status = status;

    const reports = await CustomerReport.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: reports });
  } catch (err) {
    console.error('getReports error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// update report status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const updated = await CustomerReport.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Report not found' });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
