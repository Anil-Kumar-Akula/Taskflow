const express = require('express');
const { auth, managerOnly } = require('../middleware/auth');
const { sendWeeklyReports, generateWeeklyReport } = require('../services/reportService');

const router = express.Router();

// Manually trigger weekly report send
router.post('/send-weekly', auth, managerOnly, async (req, res) => {
  try {
    await sendWeeklyReports(req.user._id);
    res.json({ message: 'Weekly report sent to your email successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Preview weekly report data
router.get('/weekly-preview', auth, managerOnly, async (req, res) => {
  try {
    const report = await generateWeeklyReport(req.user._id);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
