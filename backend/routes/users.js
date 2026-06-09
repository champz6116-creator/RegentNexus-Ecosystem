const express = require('express');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Database model mappings required at the top of routes/user.js if not present:
const Request = require('../models/Request');
const Report = require('../models/Report');
// =========================================================================
// FETCH ROUTES
// =========================================================================

// Get current logged-in user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -verificationCode');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving user profile', error: err.message });
  }
});

// Admin-only user search
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const query = req.query.q;
    const filter = query
      ? { $or: [
          { firstName: new RegExp(query, 'i') },
          { lastName: new RegExp(query, 'i') },
          { schoolMail: new RegExp(query, 'i') },
          { schoolId: new RegExp(query, 'i') }
        ]}
      : {};
    const users = await User.find(filter).select('-password -verificationCode');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error searching users', error: err.message });
  }
});

// Get user profile by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -verificationCode');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving user', error: err.message });
  }
});

// =========================================================================
// MUTATION ROUTES
// =========================================================================

// Update user profile
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.userId.toString() !== req.params.id && req.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const allowed = ['firstName', 'lastName', 'phone', 'schoolMail', 'schoolId', 'gender', 'profilePicture', 'active'];
    const update = {};

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password -verificationCode');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        schoolId: user.schoolId,
        schoolMail: user.schoolMail,
        phone: user.phone,
        gender: user.gender,
        profilePicture: user.profilePicture,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server failed to update profile', error: error.message });
  }
});

// Change password
router.put('/:id/password', verifyToken, async (req, res) => {
  try {
    if (req.userId.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(
      req.params.id,
      { $set: { password: hashedPassword } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Failed to update password', error: error.message });
  }
});

// Delete account
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.userId.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
});

// Rate user
router.post('/:id/rate', verifyToken, async (req, res) => {
  try {
    const { score, comment } = req.body;

    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    target.ratings.push({
      rater: req.userId,
      score,
      comment
    });
    await target.save();

    res.json({
      message: 'Rating submitted successfully',
      ratings: target.ratings
    });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ message: 'Failed to submit rating', error: error.message });
  }
});

/**
 * POST /api/users/submit-help
 * Dispatches a general support ticket from SettingsPage into the Admin Requests pipeline
 */
router.post('/submit-help', verifyToken, async (req, res) => {
  const { schoolMail, feedback } = req.body;
  try {
    if (!feedback) return res.status(400).json({ message: "Support summary description cannot be left blank." });
    
    const newTicket = await Request.create({
      schoolMail: schoolMail || "anonymous@regent.edu.gh",
      feedback,
      status: 'pending'
    });
    return res.status(201).json({ success: true, message: "Ticket filed successfully.", newTicket });
  } catch (err) {
    return res.status(500).json({ message: "Could not pipeline support request.", error: err.message });
  }
});

/**
 * POST /api/users/submit-report
 * Files an ecosystem report/feedback string from SettingsPage into the Admin Reports ledger
 */
router.post('/submit-report', verifyToken, async (req, res) => {
  const { targetType, targetId, category, itemTitle, feedback } = req.body;
  try {
    if (!feedback) return res.status(400).json({ message: "Report notes are required." });

    const newReport = await Report.create({
      reporter: req.userId,
      targetType: targetType || 'user',
      targetId: targetId || req.userId, // Defaults safely onto self-index if general feedback
      category: category || 'General Feedback',
      itemTitle: itemTitle || '',
      feedback
    });
    return res.status(201).json({ success: true, message: "Report logged successfully.", newReport });
  } catch (err) {
    return res.status(500).json({ message: "Could not compile tracking log.", error: err.message });
  }
});

module.exports = router;
