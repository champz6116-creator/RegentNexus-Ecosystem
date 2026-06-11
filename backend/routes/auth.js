const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Request = require('../models/Request'); 
const Report = require('../models/Report');

const router = express.Router();

// Helper to generate 6-digit verification code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Temporary memory store for password reset OTPs
const otpStore = {};

// 1. Request verification code for password change
router.post('/request-password-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ schoolMail: email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = generateCode();
    otpStore[email] = { code, timestamp: Date.now(), attempts: 0 };

    console.log(`Password reset OTP for ${email}: ${code}`);
    res.json({ message: 'Verification code sent to your email', success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send verification code', error: err.message });
  }
});

// 2. Verify password change OTP
router.post('/verify-password-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and verification code are required' });

    const storedOtp = otpStore[email];
    if (!storedOtp) return res.status(400).json({ message: 'No code found for this email' });

    if (Date.now() - storedOtp.timestamp > 10 * 60 * 1000) {
      delete otpStore[email];
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    if (storedOtp.attempts >= 3) {
      delete otpStore[email];
      return res.status(400).json({ message: 'Too many failed attempts' });
    }

    if (storedOtp.code !== code) {
      storedOtp.attempts += 1;
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    delete otpStore[email];
    res.json({ message: 'Verified successfully', success: true, verified: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify code', error: err.message });
  }
});

// 3. Registration Route
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, schoolId, schoolMail, phone, password, verificationMode, gender } = req.body;
    
    if (!firstName || !lastName || !schoolId || !schoolMail || !phone || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedEmail = schoolMail.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@regent.edu.gh')) {
      return res.status(400).json({ 
        message: 'Registration rejected. You must use an authorized @regent.edu.gh university email.' 
      });
    }

    const existing = await User.findOne({ $or: [{ schoolMail: normalizedEmail }, { phone }, { schoolId }] });
    if (existing) return res.status(400).json({ message: 'Account already exists' });

    const mode = verificationMode || 'email';
    const code = mode === 'admin' ? null : generateCode();
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      schoolId,
      schoolMail: normalizedEmail,
      phone,
      gender, 
      password: hashed,
      verificationMode: mode,
      verificationCode: code,
      verified: false, 
    });

    if (mode === 'admin') {
      await Request.create({
        schoolMail: normalizedEmail,
        feedback: `New User Registration Approval Request: ${firstName} ${lastName} (ID: ${schoolId})`,
        status: 'pending'
      });
    } else {
      console.log(`Verification code for ${normalizedEmail}: ${code}`);
    }

    if (ActivityLog) {
      await ActivityLog.create({ user: user._id, action: 'register', details: `Registered via ${mode}` });
    }

    res.json({
      user: { 
        _id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName,
        schoolId: user.schoolId,
        schoolMail: user.schoolMail,
        phone: user.phone,
        gender: user.gender,
        role: user.role, 
        verified: user.verified 
      },
      verificationPending: true,
      verificationMode: mode,
      message: mode === 'admin' 
        ? 'Account registered. Awaiting administrative approval.' 
        : `Verification code sent by ${mode}.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Login Route
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or: [{ schoolMail: identifier }, { phone: identifier }] });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.active) return res.status(403).json({ message: 'Account disabled' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    
    if (!user.verified) {
      return res.status(401).json({ 
        message: 'Account not verified', 
        needsVerification: true,
        verificationMode: user.verificationMode || 'email'
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    
    res.json({ 
        token, 
        user: { 
          _id: user._id, 
          firstName: user.firstName, 
          lastName: user.lastName,
          schoolId: user.schoolId,
          schoolMail: user.schoolMail, 
          phone: user.phone,
          gender: user.gender,
          role: user.role, 
          verified: user.verified 
        }, 
        message: 'Logged in successfully' 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Request / Resend Verification Code
router.post('/request-verification', async (req, res) => {
  try {
    const { identifier, mode } = req.body;
    const user = await User.findOne({ $or: [{ schoolMail: identifier }, { phone: identifier }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const selectedMode = mode || user.verificationMode || 'email';
    const newCode = generateCode();
    
    user.verificationMode = selectedMode;
    user.verificationCode = newCode;
    await user.save();

    console.log(`New verification code (${selectedMode}) for ${user.schoolMail}: ${newCode}`);

    if (ActivityLog) {
      await ActivityLog.create({ user: user._id, action: 'request-verification', details: `Sent via ${selectedMode}` });
    }
    res.json({ message: `Verification code sent by ${selectedMode.toUpperCase()}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Confirm Verification Code
router.post('/confirm-verification', async (req, res) => {
  try {
    const { identifier, code } = req.body;
    const user = await User.findOne({ $or: [{ schoolMail: identifier }, { phone: identifier }] });
    if (!user || user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    user.verified = true;
    user.verificationCode = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    if (ActivityLog) await ActivityLog.create({ user: user._id, action: 'confirm-verification', details: 'Verified' });

    res.json({ 
      token, 
      user: { 
        _id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName,
        schoolId: user.schoolId,
        schoolMail: user.schoolMail,
        phone: user.phone,
        gender: user.gender,
        role: user.role, 
        verified: true 
      }, 
      message: 'Verified successfully' 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;