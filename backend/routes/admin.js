const express = require('express');
const router = express.Router();

// Database Model Registry
const User = require('../models/User');
const Item = require('../models/Item');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const Request = require('../models/Request'); 

// Middleware Gatekeepers
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/admin/dashboard-aggregations
 * Synchronizes administrative metric points instantly
 */
router.get('/dashboard-aggregations', requireRole('admin'), async (req, res) => {
  try {
    const [users, listings, reports, requests] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments({ status: 'active' }),
      Report.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'pending' }) // Tracks active pending tickets responsively
    ]);
    return res.json({ users, listings, reports, requests }); 
  } catch (err) {
    return res.status(500).json({ message: "Metrics synchronization failed" });
  }
});

/**
 * GET /api/admin/data/:tab
 * Fetches data collections sorted chronologically: Newest records at the top
 */
router.get('/data/:tab', requireRole('admin'), async (req, res) => {
  const { tab } = req.params;
  try {
    if (tab === 'users') {
      // Returns all users newest first, omitting security strings
      const users = await User.find({}, '-password -verificationCode').sort({ createdAt: -1 }); 
      return res.json(users);
    } 
    
    if (tab === 'listings') {
      const listings = await Item.find({}).sort({ createdAt: -1 }); 
      return res.json(listings);
    }
    
    if (tab === 'reports') {
      const reports = await Report.find({}).sort({ createdAt: -1 });
      return res.json(reports);
    }

    if (tab === 'requests') {
      const requests = await Request.find({}).sort({ createdAt: -1 }); 
      return res.json(requests); 
    }

    return res.json([]);
  } catch (error) {
    console.error(`Error fetching admin grid for ${tab}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * POST /api/admin/reports/:id/resolve
 * Contextual Governance Suite: Handles Dismiss, Item Purge, or Global Account Ban
 */
router.post('/reports/:id/resolve', requireRole('admin'), async (req, res) => {
  const { actionType } = req.body; // Expected: 'dismiss' | 'delete-listing' | 'ban-user-all'
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report node missing." });

    if (actionType === 'dismiss') {
      report.status = 'rejected';
    } 
    
    else if (actionType === 'delete-listing') {
      report.status = 'accepted';
      if (report.targetType === 'listing') {
        await Item.findByIdAndDelete(report.targetId); // Wipe out specific listing
      }
    } 
    
    else if (actionType === 'ban-user-all') {
      report.status = 'accepted';
      
      // Identify target user id
      let targetUserId = report.targetId;
      if (report.targetType === 'listing') {
        const item = await Item.findById(report.targetId);
        if (item) targetUserId = item.owner;
      }

      // Nuclear Cascade: Ban user account and purge all listings owned by them
      await User.findByIdAndUpdate(targetUserId, { active: false, isBanned: true });
      await Item.deleteMany({ owner: targetUserId });
    }

    report.resolvedBy = req.userId;
    await report.save();

    await ActivityLog.create({ 
      user: req.userId, 
      action: `resolve-report-${actionType}`, 
      details: `Processed report ${report._id} via contextual action: ${actionType}` 
    });

    return res.json({ message: `Governance action '${actionType}' completed successfully.`, report });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/users/:id/note
 * Update administrative sticky memos attached to individual student accounts
 */
router.post('/users/:id/note', requireRole('admin'), async (req, res) => {
  const { adminNote } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { adminNote }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ message: "Sticky note updated successfully.", adminNote: user.adminNote });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/requests/:id/resolve
 * Lifecycle management for student help and verification tickets
 */
router.post('/requests/:id/resolve', requireRole('admin'), async (req, res) => {
  const { status } = req.body; // Expected values: 'resolved' | 'rejected'
  try {
    const ticket = await Request.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!ticket) return res.status(404).json({ message: "Assistance ticket footprint missing." });

    await ActivityLog.create({
      user: req.userId,
      action: `resolve-ticket`,
      details: `Marked support ticket ${ticket._id} from ${ticket.schoolMail} as ${status}`
    });
    return res.json({ message: `Ticket successfully closed out as ${status}.`, ticket });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/users/:id/ban
 */
router.post('/users/:id/ban', requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User profile node missing.' });
    
    user.active = !user.active;
    await user.save();
    
    await ActivityLog.create({ 
      user: req.userId, 
      action: user.active ? 'unban-user' : 'ban-user', 
      details: `${user.active ? 'Restored' : 'Banned'} user profile state for ${user._id}` 
    });
    
    return res.json({ message: "User access status toggled successfully.", active: user.active });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Target identity profile node not found.' });

    await ActivityLog.create({ user: req.userId, action: 'purge-user', details: `Permanently purged user account index ${req.params.id}` });
    return res.json({ message: 'The account has been completely removed.' });
  } catch (err) {
    return res.status(500).json({ message: 'Something went wrong on our end. Please try again.' });
  }
});

module.exports = router;