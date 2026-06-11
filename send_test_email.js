const nodemailer = require('nodemailer');
require('dotenv').config({ path: './backend/.env' });

(async () => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
    });

    const mailOptions = {
      from: `Campus Marketplace <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'RegentNexus SMTP Test',
      text: 'This is a test email from the RegentNexus SMTP diagnostic script.',
      html: '<div><strong>This is a test email from the RegentNexus SMTP diagnostic script.</strong></div>'
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('SEND_OK', info);
  } catch (err) {
    console.error('SEND_ERR', err);
    process.exit(2);
  }
})();