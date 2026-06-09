const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['user', 'listing'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  category: { type: String, default: 'General Feedback' }, // 🌟 NEW: e.g., "Inappropriate Behavior", "Wrong Price"
  itemTitle: { type: String, default: '' },                 // 🌟 NEW: Captured snapshot of the reported item title
  feedback: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  response: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Report', reportSchema);
