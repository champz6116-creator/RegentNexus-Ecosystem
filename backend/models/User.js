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
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  schoolId: { type: String, required: true, unique: true },
  schoolMail: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  
  // Verification Processing System
  verified: { type: Boolean, default: false },
  verificationMode: { type: String, enum: ['email', 'sms', 'admin'], default: 'email' },
  verificationCode: { type: String },
  
  // Demographics & Customizations
  gender: { type: String, enum: ['Male', 'Female', ''], default: '' },
  profileImage: { type: String, default: '' }, // Stores Cloudinary or local upload image URL string
  
  // Global Governance & Administrative Tracking Flags
  active: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false }, // Explicit Admin Governance block flag
  
  // Interactive Application Relationships
  cart: [cartItemSchema],
  starredServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  ratings: [ratingSchema],
}, { 
  timestamps: true // Replaces manual createdAt fields with automated, standard Mongo createdAt and updatedAt markers
});

module.exports = mongoose.model('User', userSchema);