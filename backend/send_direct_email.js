require('dotenv').config({ path: './.env' });
const { sendEmailOTP } = require('./services/otpService');

(async () => {
  try {
    const recipient = 'faith.ugwo@regent.edu.gh';
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Sending test verification to ${recipient} with code ${testCode}...`);
    await sendEmailOTP(recipient, testCode);
    console.log('TEST_EMAIL_SENT');
  } catch (err) {
    console.error('TEST_EMAIL_ERROR', err.message);
    process.exit(2);
  }
})();