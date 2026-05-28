const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { generateOTP, sendEmailOTP, sendSMSOTP, storeOTP, verifyOTP } = require('../services/otpService');

const router = express.Router();

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/register', async (req, res) => {
  console.log("📥 [Backend] Register attempt:", req.body.schoolMail); // ADD THIS
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

    // Send verification code if not admin mode
    if (mode !== 'admin') {
      if (mode === 'sms') {
        await sendSMSOTP(phone, code);
      } else {
        await sendEmailOTP(schoolMail, code);
      }
    }

    await ActivityLog.create({ user: user._id, action: 'register', details: `Registered account via ${user.verificationMode}` });

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
  console.log("📥 [Backend] Login attempt:", req.body.identifier); // ADD THIS
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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, schoolMail: user.schoolMail, phone: user.phone, role: user.role, verified: user.verified } });
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

    await ActivityLog.create({ user: user._id, action: 'request-verification', details: `Requested verification via ${user.verificationMode}` });
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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await ActivityLog.create({ user: user._id, action: 'confirm-verification', details: 'Account verified' });

    res.json({ token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, schoolMail: user.schoolMail, phone: user.phone, role: user.role, verified: user.verified } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Request OTP (Email or SMS)
router.post('/request-otp', async (req, res) => {
  try {
    const { email, phone, method } = req.body;
    const user = await User.findOne({ $or: [{ schoolMail: email }, { phone }] });
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    const identifier = method === 'sms' ? phone : email;
    
    storeOTP(identifier, otp, method);

    if (method === 'sms') {
      const success = await sendSMSOTP(phone, otp);
      if (!success) return res.status(500).json({ message: 'Failed to send SMS OTP' });
    } else {
      const success = await sendEmailOTP(email, otp);
      if (!success) return res.status(500).json({ message: 'Failed to send email OTP' });
    }

    await ActivityLog.create({ user: user._id, action: 'request-otp', details: `OTP requested via ${method}` });
    res.json({ message: `OTP sent via ${method}`, identifier });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify OTP and Login
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, phone, method, otp } = req.body;
    const identifier = method === 'sms' ? phone : email;

    const otpResult = verifyOTP(identifier, otp);
    if (!otpResult.valid) {
      return res.status(400).json({ message: otpResult.message });
    }

    const user = await User.findOne({ $or: [{ schoolMail: email }, { phone }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.verified) {
      user.verified = true;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await ActivityLog.create({ user: user._id, action: 'otp-login', details: `Logged in via ${method} OTP` });

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        schoolMail: user.schoolMail, 
        phone: user.phone, 
        role: user.role, 
        verified: user.verified 
      },
      message: 'OTP verified. Logged in successfully.' 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
