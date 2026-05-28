const express = require('express');
const User = require('../models/User');
const { requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs'); // Needed for the secure password hashing

const router = express.Router();

// Get current logged-in user profile
router.get('/me', async (req, res) => {
  const user = await User.findById(req.userId).select('-password -verificationCode');
  res.json(user);
});

// Get user profile by ID
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -verificationCode');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Admin-only user search query list
router.get('/', requireRole('admin'), async (req, res) => {
  const query = req.query.q;
  const filter = query
    ? { $or: [{ firstName: new RegExp(query, 'i') }, { lastName: new RegExp(query, 'i') }, { schoolMail: new RegExp(query, 'i') }, { schoolId: new RegExp(query, 'i') }] }
    : {};
  const users = await User.find(filter).select('-password -verificationCode');
  res.json(users);
});

// UPDATED: Profile detail update controller (keeps individual atomic fields modifiable)
router.put('/:id', async (req, res) => {
  if (req.userId !== req.params.id && req.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  // Merged existing fields with your new profile layout properties
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

// NEW: Post-MFA secure passphrase mutation route
router.put('/:id/password', async (req, res) => {
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
router.post('/:id/rate', async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'Target user not found' });

  const { score, comment } = req.body;
  target.ratings.push({ rater: req.userId, score, comment });
  await target.save();

  res.json({ message: 'Rating submitted', ratings: target.ratings });
});

module.exports = router;