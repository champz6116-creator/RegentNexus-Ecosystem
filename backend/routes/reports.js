const express = require('express');
const Report = require('../models/Report');
const Request = require('../models/Request'); // 🌟 ADDED: Correctly import your dedicated Request model
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// =========================================================================
// STANDARD PRE-EXISTING APP CONTENT REPORT ROUTES
// =========================================================================
router.post('/', async (req, res) => {
  const { targetType, targetId, feedback } = req.body;
  if (!targetType || !targetId || !feedback) {
    return res.status(400).json({ message: 'Missing report fields' });
  }

  const report = await Report.create({ reporter: req.userId, targetType, targetId, feedback });
  res.status(201).json(report);
});

router.get('/', async (req, res) => {
  if (req.role === 'admin') {
    const reports = await Report.find().populate('reporter', 'firstName lastName schoolMail');
    return res.json(reports);
  }

  const reports = await Report.find({ reporter: req.userId });
  res.json(reports);
});

router.put('/:id/status', requireRole('admin'), async (req, res) => {
  const { status, response } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status, response, resolvedBy: req.userId },
    { new: true }
  );

  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json(report);
});

// =========================================================================
// 🌟 FULLY OPTIMIZED AND MATCHED CAMPUS SUPPORT TICKET ROUTE
// =========================================================================
router.post('/requests/create', async (req, res) => {
  const { schoolMail, feedback } = req.body;
  if (!schoolMail || !feedback) {
    return res.status(400).json({ message: 'Missing support ticket fields' });
  }

  try {
    // Matches your models/Request.js schema variables directly
    const ticket = await Request.create({
      schoolMail: schoolMail,
      feedback: feedback
      // status field defaults dynamically to 'pending' as defined in your model layout
    });
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error("Support ticket schema validation or save failed:", error);
    res.status(500).json({ message: 'Server error processing support ticket' });
  }
});

module.exports = router;