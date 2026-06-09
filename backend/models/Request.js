const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  schoolMail: {
    type: String,
    required: true,
    trim: true
  },
  feedback: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'resolved'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Request', RequestSchema);
