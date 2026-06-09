const mongoose = require('mongoose');

// Schema for tracking ratings left on this user's profile as a service provider
const ratingSchema = new mongoose.Schema({
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: { type: Number, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

// Schema for persistent user shopping cart instances
const cartItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, default: 1, min: 1 },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Za-zÀ-ÿ\s'-]+$/.test(v); // Rejects numbers & special symbols
      },
      message: 'First name can only contain letters, hyphens, or spaces.'
    }
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Za-zÀ-ÿ\s'-]+$/.test(v); 
      },
      message: 'Last name can only contain letters, hyphens, or spaces.'
    }
  },
  schoolId: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  schoolMail: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true, // Forces lowercase mapping to avoid case-sensitivity issues
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9._%+-]+@regent\.edu\.gh$/.test(v);
      },
      message: 'Registration is restricted to authorized @regent.edu.gh email accounts.'
    }
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?[0-9\s-]{10,15}$/.test(v); // Assures numerical telephone layout integrity
      },
      message: 'Please enter a valid phone number (10-15 digits).'
    }
  },
  password: { 
    type: String, 
    required: true,
    minlength: [8, 'Security requirement: Password must be at least 8 characters long']
  },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  
  // Verification Processing System
  verified: { type: Boolean, default: false },
  verificationMode: { type: String, enum: ['email', 'sms', 'admin'], default: 'email' },
  verificationCode: { type: String },
  
  // Demographics & Customizations
  gender: { type: String, enum: ['Male', 'Female', ''], default: '' },
  profileImage: { type: String, default: '' }, 

  // Global Governance & Administrative Tracking Flags
  active: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false }, 
  adminNote: { type: String, default: '' }, 

  // Interactive Application Relationships
  cart: [cartItemSchema],
  starredServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  ratings: [ratingSchema],
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema);