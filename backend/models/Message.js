const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: function() { return !this.isSystemAction; } // Optional only if system generated
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.isSystemAction; } // Optional only if system generated
  },
  contextItem: {
    type: String,
    default: 'General Exchange'
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  isSystemAction: {
    type: Boolean,
    default: false
  },
  isReportNotice: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', MessageSchema);