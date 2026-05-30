const express = require('express');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs'); // Needed for the secure password hashing

const router = express.Router();

// =========================================================================
// FETCH ROUTES (PROFILE DISCOVERY & QUERIES)
// =========================================================================

// Get current logged-in user profile
router.get('/me', verifyToken, async (req, res) => {
  const user = await User.findById(req.userId).select('-password -verificationCode');
  res.json(user);
});

// Admin-only user search query list
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  const query = req.query.q;
  const filter = query
    ? { $or: [{ firstName: new RegExp(query, 'i') }, { lastName: new RegExp(query, 'i') }, { schoolMail: new RegExp(query, 'i') }, { schoolId: new RegExp(query, 'i') }] }
    : {};
  const users = await User.find(filter).select('-password -verificationCode');
  res.json(users);
});

// Get user profile by ID (Placed below concrete endpoints to avoid greedy route capturing)
router.get('/:id', verifyToken, async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -verificationCode');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// =========================================================================
// MUTATION ROUTES (PROFILE MODIFICATIONS & UPGRADES)
// =========================================================================

// 🌟 INTEGRATED FIX: Secure Profile Information Update Node
// Replaces fragile URL id strings with explicit verifyToken extraction mapping
router.put('/profile/update', verifyToken, async (req, res) => {
  try {
    const userId = req.userId; // Extracted safely from verified token block
    const { firstName, lastName, phone, gender, profileImage, profilePicture } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    // Assign updates cleanly while resolving incoming key naming discrepancies
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    
    // Captures both payload key names to eliminate missing database persistence updates
    if (profileImage !== undefined) user.profilePicture = profileImage;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();
    
    // Return sanitized data (no passwords)
    return res.status(200).json({
      success: true,
      message: 'Profile update effective throughout all layers.',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        schoolId: user.schoolId,
        schoolMail: user.schoolMail,
        phone: user.phone,
        gender: user.gender,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    console.error("Profile compilation backend drop:", err);
    return res.status(500).json({ message: 'Internal transaction pipeline transmission failed.' });
  }
});

// Legacy Profile Detail Update Controller (Kept for fallback compatibility & Admins)
router.put('/:id', verifyToken, async (req, res) => {
  if (req.userId !== req.params.id && req.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const allowed = ['firstName', 'lastName', 'phone', 'schoolMail', 'active', 'gender', 'profilePicture'];
  const update = {};
  
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { $set: update }, 
      { new: true, runValidators: true }
    ).select('-password -verificationCode');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server failed to process profile adjustments.' });
  }
});

// Post-MFA secure passphrase mutation route
router.put('/:id/password', verifyToken, async (req, res) => {
  if (req.userId !== req.params.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.params.id, { $set: { password: hashedPassword } });
    return res.status(200).json({ message: 'Passphrase updated successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to rewrite credentials.' });
  }
});

// Rate user endpoint
router.post('/:id/rate', verifyToken, async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'Target user not found' });

  const { score, comment } = req.body;
  target.ratings.push({ rater: req.userId, score, comment });
  await target.save();

  res.json({ message: 'Rating submitted', ratings: target.ratings });
});

module.exports = router;