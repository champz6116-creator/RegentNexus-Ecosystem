const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

// Force Google's DNS for MongoDB SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/regentnexus');
    const hashed = await bcrypt.hash('admin123', 10); // Default password, change later
    const admin = await User.findOneAndUpdate(
      { schoolMail: 'rooney.uwho@regent.edu.gh' },
      {
        firstName: 'Rooney',
        lastName: 'Uwho Victor',
        schoolId: '00500122',
        schoolMail: 'rooney.uwho@regent.edu.gh',
        phone: '0530282249',
        password: hashed,
        role: 'admin',
        verified: true,
        active: true
      },
      { upsert: true, new: true }
    );
    console.log('Admin user created/updated:', admin);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

createAdmin();