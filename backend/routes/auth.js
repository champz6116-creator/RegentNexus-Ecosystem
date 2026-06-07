const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const otpStore = {};

// Request verification code for password change
router.post('/request-password-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ schoolMail: email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const code = generateCode();
    otpStore[email] = {
      code,
      timestamp: Date.now(),
      attempts: 0
    };

    console.log(`Password reset OTP for ${email}: ${code}`);

    res.json({
      message: 'Verification code sent to your email',
      success: true
    });
  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({ message: 'Failed to send verification code', error: err.message });
  }
});

// Verify password change OTP
router.post('/verify-password-otp', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const storedOtp = otpStore[email];
    if (!storedOtp) {
      return res.status(400).json({ message: 'No verification code found for this email' });
    }

    // Check OTP expiration (10 minutes)
    if (Date.now() - storedOtp.timestamp > 10 * 60 * 1000) {
      delete otpStore[email];
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Check attempts
    if (storedOtp.attempts >= 3) {
      delete otpStore[email];
      return res.status(400).json({ message: 'Too many failed attempts' });
    }

    if (storedOtp.code !== code) {
      storedOtp.attempts += 1;
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Code is valid, clear it
    delete otpStore[email];

    res.json({
      message: 'Verification code verified successfully',
      success: true,
      verified: true
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Failed to verify code', error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, schoolId, schoolMail, phone, password, verificationMode } = req.body;
    if (!firstName || !lastName || !schoolId || !schoolMail || !phone || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await User.findOne({ $or: [{ schoolMail }, { phone }, { schoolId }] });
    if (existing) return res.status(400).json({ message: 'Account already exists with provided details' });

    const mode = verificationMode || 'email';
    const code = mode === 'admin' ? null : generateCode();
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      lastName,
      schoolId,
      schoolMail,
      phone,
      password: hashed,
      verificationMode: mode,
      verificationCode: code,
      verified: mode === 'admin',
    });

    if (mode !== 'admin') {
      console.log(`Verification code for ${schoolMail}: ${code}`);
    }

    if (ActivityLog) {
      await ActivityLog.create({ user: user._id, action: 'register', details: `Registered via ${mode}` });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        schoolMail: user.schoolMail,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
      },
      verificationPending: !user.verified,
      message: user.verified ? 'Account registered and verified successfully.' : `Verification code sent by ${user.verificationMode}. Use 6-digit code to confirm.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or: [{ schoolMail: identifier }, { phone: identifier }] });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.active) return res.status(403).json({ message: 'Account disabled' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.verified) {
      return res.status(401).json({ message: 'Account not verified', needsVerification: true });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, id: user._id, firstName: user.firstName, lastName: user.lastName, schoolMail: user.schoolMail, phone: user.phone, role: user.role, verified: user.verified, profilePicture: user.profilePicture }, message: 'Logged in successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/request-verification', async (req, res) => {
  try {
    const { identifier, mode } = req.body;
    const user = await User.findOne({ $or: [{ schoolMail: identifier }, { phone: identifier }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const selectedMode = mode || user.verificationMode || 'email';
    user.verificationMode = selectedMode;
    user.verificationCode = generateCode();
    await user.save();

    if (selectedMode === 'sms') {
      const success = await sendSMSOTP(user.phone, user.verificationCode);
      if (!success) return res.status(500).json({ message: 'Failed to send SMS verification code' });
    } else {
      const success = await sendEmailOTP(user.schoolMail, user.verificationCode);
      if (!success) return res.status(500).json({ message: 'Failed to send email verification code' });
    }

    if (ActivityLog) {
      await ActivityLog.create({ user: user._id, action: 'request-verification', details: `Verification code sent via ${selectedMode}` });
    }
    res.json({ message: `Verification code sent by ${user.verificationMode}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/confirm-verification', async (req, res) => {
  try {
    const { identifier, code } = req.body;
    const user = await User.findOne({ $or: [{ schoolMail: identifier }, { phone: identifier }] });
    if (!user || user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.verified = true;
    user.verificationCode = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    if (ActivityLog) {
      await ActivityLog.create({ user: user._id, action: 'confirm-verification', details: 'Account verified' });
    }

    res.json({ token, user: { _id: user._id, id: user._id, firstName: user.firstName, lastName: user.lastName, schoolMail: user.schoolMail, phone: user.phone, role: user.role, verified: user.verified }, message: 'Account verified successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
