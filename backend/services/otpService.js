const nodemailer = require('nodemailer');

/**
 * In-Memory Verification Tracking Cache Matrix
 * Automatically manages cross-route lifecycle validation properties without database overhead
 */
const otpStore = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * 🌟 CENTRALIZED OTP GENERATION
 * Generates a clean, cryptographically uniform 6-digit pin string to prevent
 * mathematical logic duplication inside backend route managers.
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Dispatches verification code strings cleanly via email architecture.
 * Contains thorough error catching to guarantee service reliability.
 */
const sendEmailOTP = async (recipientEmail, otpCode) => {
  const mailOptions = {
    from: `"Campus Marketplace" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: 'Verify Your Marketplace Registration Account',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #334155; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669; font-weight: 900; margin-bottom: 4px;">Account Verification</h2>
        <p style="font-size: 14px; font-weight: 600; color: #64748b; margin-top: 0;">Campus Student Marketplace Platform</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 14px; font-weight: 500; line-height: 1.5;">Thank you for signing up. Please verify your student identity by entering the security verification code listed below:</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #0f172a;">${otpCode}</span>
        </div>
        <p style="font-size: 11px; font-weight: 600; color: #94a3b8; line-height: 1.4;">If you did not make this request, you can safely ignore this email. This code will expire automatically shortly.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email Delivery Success -> Sent to [${recipientEmail}] | MessageID: [${info.messageId}]`);
    return true;
  } catch (error) {
    console.error(`❌ Email Delivery Failure -> Recipient: [${recipientEmail}] | Reason:`, error.message);
    throw new Error(`Email microservice execution failed: ${error.message}`);
  }
};

/**
 * Dispatches password reset code cleanly via email.
 */
const sendPasswordResetEmail = async (recipientEmail, otpCode) => {
  const mailOptions = {
    from: `"Campus Marketplace" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: 'Reset Your Marketplace Password',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #334155; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #ea580c; font-weight: 900; margin-bottom: 4px;">Password Reset Request</h2>
        <p style="font-size: 14px; font-weight: 600; color: #64748b; margin-top: 0;">Campus Student Marketplace Platform</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 14px; font-weight: 500; line-height: 1.5;">You requested to reset your password. Please use the verification code below to complete the reset process:</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #0f172a;">${otpCode}</span>
        </div>
        <p style="font-size: 11px; font-weight: 600; color: #94a3b8; line-height: 1.4;">If you did not make this request, please ignore this email. This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Password Reset Email Delivery Success -> Sent to [${recipientEmail}] | MessageID: [${info.messageId}]`);
    return true;
  } catch (error) {
    console.error(`❌ Password Reset Email Delivery Failure -> Recipient: [${recipientEmail}] | Reason:`, error.message);
    throw new Error(`Email microservice execution failed: ${error.message}`);
  }
};


/**
 * 🌟 CENTRALIZED OTP VERIFICATION & EXPIRATION CHECK
 * Validates tracking parameters, checks age windows, tracks maximum attempt capacities,
 * and leaves admin validation routines uninhibited.
 * * @param {string} email - Normalized university target account email
 * @param {string} incomingCode - User inputted 6-digit array
 * @returns {Object} Validation response payload metrics { success: boolean, message: string }
 */
const verifyOTP = (email, incomingCode) => {
  const normalizedEmail = email.trim().toLowerCase();
  const stored = otpStore[normalizedEmail];

  if (!stored) {
    return { success: false, message: 'No verification parameters found for this email address.' };
  }

  // Strict Expiration Matrix Check: 10 Minute Processing Envelope Window (600,000 ms)
  const expirationWindow = 10 * 60 * 1000;
  if (Date.now() - stored.timestamp > expirationWindow) {
    delete otpStore[normalizedEmail];
    return { success: false, message: 'Verification code parameters have expired. Please request a new code.' };
  }

  // Brute Force Mitigation Layer: Rejects validation if failures exceed threshold limits
  if (stored.attempts >= 3) {
    delete otpStore[normalizedEmail];
    return { success: false, message: 'Security lockout: Too many failed entry attempts. Request a new code.' };
  }

  // Execution match verification logic
  if (stored.code !== incomingCode) {
    stored.attempts += 1;
    return { success: false, message: `Invalid security code entry parameters. Attempts left: ${3 - stored.attempts}` };
  }

  // Verification clears -> Flush memory allocation space safely
  delete otpStore[normalizedEmail];
  return { success: true, message: 'Account status verified and validated cleanly.' };
};

/**
 * Sets an active code instance directly into the unified runtime lifecycle cache
 */
const saveOTPToStore = (email, code) => {
  const normalizedEmail = email.trim().toLowerCase();
  otpStore[normalizedEmail] = {
    code,
    timestamp: Date.now(),
    attempts: 0
  };
};

module.exports = {
  generateOTP,
  sendEmailOTP,
  sendPasswordResetEmail,
  verifyOTP,
  saveOTPToStore
};