const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Email
const sendEmailOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Authentication OTP - RegentNexus',
      html: `
        <h2>RegentNexus Authentication</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP sent to email:', email);
    return true;
  } catch (error) {
    console.error('Email OTP failed:', error);
    return false;
  }
};

// Send OTP via SMS
const sendSMSOTP = async (phoneNumber, otp) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: `Your RegentNexus OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('OTP sent to SMS:', phoneNumber);
    return true;
  } catch (error) {
    console.error('SMS OTP failed:', error);
    return false;
  }
};

// Store OTP temporarily (in production, use Redis)
const otpStore = new Map();

const storeOTP = (identifier, otp, type) => {
  const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(identifier, { otp, type, expiryTime });
};

const verifyOTP = (identifier, otp) => {
  const stored = otpStore.get(identifier);
  
  if (!stored) {
    return { valid: false, message: 'Verification code not found.' };
  }

  if (Date.now() > stored.expiryTime) {
    otpStore.delete(identifier);
    return { valid: false, message: 'Your verification code has expired. Please request a new one.' };
  }

  if (stored.otp !== otp) {
    return { valid: false, message: 'Incorrect verification code. Please try again.' };
  }

  otpStore.delete(identifier);
  return { valid: true, message: 'OTP verified' };
};

module.exports = {
  generateOTP,
  sendEmailOTP,
  sendSMSOTP,
  storeOTP,
  verifyOTP
};
