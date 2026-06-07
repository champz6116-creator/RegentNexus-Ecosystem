const express = require('express');
const router = express.Router();

// Database Model Registry
const User = require('../models/User');
const Item = require('../models/Item');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');

// Middleware Gatekeepers
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * GET /admin/overview
 * Compiles global ecosystem diagnostic metrics, pending reports, and terminal system logs.
 */
router.get('/overview', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.countDocuments();
    const listings = await Item.countDocuments({ status: 'active' });
    const reports = await Report.countDocuments({ status: 'pending' });
    const reportsList = await Report.find({ status: 'pending' }).limit(10);
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(20).select('action details createdAt');

    return res.json({
      overview: { users, listings, reports },
      reports: reportsList,
      logs: logs.map(log => ({
        message: `${new Date(log.createdAt).toLocaleString()}: ${log.details}`,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * NEW ALIAS ROUTE: GET /admin/dashboard-aggregations
 * Maps the exact response signature required by the mobile/web metric screens.
 */
router.get('/dashboard-aggregations', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [users, listings, reports] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments({ status: 'active' }),
      Report.countDocuments({ status: 'pending' })
    ]);
    
    // Returns clean metric vectors mapping to state expectations
    return res.json({ users, listings, reports, requests: 0 }); 
  } catch (err) {
    return res.status(500).json({ message: "Metrics sync failed" });
  }
});

/**
 * NEW ROUTE: GET /admin/users
 * Pulls all registered identities from the ledger for administrative oversight.
 */
router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // Explicitly selects only needed traits, omitting sensitive data like password hashes
    const users = await User.find({}).select('firstName lastName schoolMail active verified').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch user ledger data." });
  }
});

/**
 * POST /admin/reports/:id/accept
 * Endorses a marketplace complaint and shifts status to accepted.
 */
router.post('/reports/:id/accept', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { status: 'accepted' }, { new: true });
    if (!report) return res.status(404).json({ message: "We couldn't find that report."});
    
    await ActivityLog.create({ user: req.userId, action: 'accept-report', details: `Accepted report ${report._id}` });
    return res.json({ message: 'Report accepted and processed successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * POST /admin/reports/:id/reject
 * Suppresses a marketplace complaint and clears the transaction pipeline state.
 */
router.post('/reports/:id/reject', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!report) return res.status(404).json({ message: 'Report matching ledger reference identifier missing.' });
    
    await ActivityLog.create({ user: req.userId, action: 'reject-report', details: `Rejected report ${report._id}` });
    return res.json({ message: 'Report rejected and closed clean.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * POST /admin/users/:id/verify
 * Manually authorizes student clearance markers bypassing registration steps.
 */
router.post('/users/:id/verify', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { verified: true }, { new: true }).select('-password -verificationCode');
    if (!user) return res.status(404).json({ message: "We couldn't find this student's profile."});
    
    await ActivityLog.create({ user: req.userId, action: 'verify-user', details: `Verified user ${user._id}` });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * UPDATED ROUTE: POST /admin/users/:id/ban
 * Dynamically toggles active boolean values (ban/unban) to match the dashboard interface.
 */
router.post('/users/:id/ban', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User profile node missing.' });
    
    // Toggle active status (active: false means banned)
    user.active = !user.active;
    await user.save();
    
    await ActivityLog.create({ 
      user: req.userId, 
      action: user.active ? 'unban-user' : 'ban-user', 
      details: `${user.active ? 'Restored' : 'Banned'} user profile state for ${user._id}` 
    });
    
    // Omit sensitive strings before returning data node
    const baseUser = user.toObject();
    delete baseUser.password;
    delete baseUser.verificationCode;
    
    return res.json(baseUser);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * POST /admin/listings/:id/remove
 * Forcefully drops a rogue item layout submission from the active marketplace feed.
 */
router.post('/listings/:id/remove', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const listing = await Item.findByIdAndUpdate(req.params.id, { status: 'removed' }, { new: true });
    if (!listing) return res.status(404).json({ message: 'This listing is no longer available.' });
    
    await ActivityLog.create({ user: req.userId, action: 'remove-listing', details: `Removed listing ${listing._id}` });
    return res.json(listing);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /admin/users/:id
 * Purges a user's absolute database index identity footprint from the system completely.
 */
router.delete('/users/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Target identity profile node not found.' });

    await ActivityLog.create({ user: req.userId, action: 'purge-user', details: `Permanently purged user account index ${req.params.id}` });
    return res.json({ message: 'The account has been completely removed.' });
  } catch (err) {
    return res.status(500).json({ message: 'Something went wrong on our end. Please try again.' });
  }
});

/**
 * RESTORED ROUTE: GET /admin/dashboard
 * Feeds the frontend admin panel with the expected metric variables.
 */
router.get('/dashboard', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const listingCount = await Item.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const transactionCount = await Transaction.countDocuments();
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(20);

    res.json({ userCount, listingCount, pendingReports, transactionCount, logs });
  } catch (err) {
    res.status(500).json({ message: 'Dashboard metrics failed to load.' });
  }
});

module.exports = router;