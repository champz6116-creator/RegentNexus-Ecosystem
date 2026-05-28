const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: { type: Number, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  type: { type: String, enum: ['item', 'service'], default: 'item' },
  note: String,
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1, min: 0 },
  
  // MANDATORY IMAGE SPEC: Strictly required if posting a physical marketplace item
  imageUrl: { 
    type: String, 
    required: function () { 
      return this.type === 'item'; 
    } 
  },

  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'removed'], default: 'active' },
  ratings: [ratingSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

itemSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Item', itemSchema);
