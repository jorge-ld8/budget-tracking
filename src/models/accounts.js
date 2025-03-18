const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  balance: { type: Number, required: true, default: 0 },
  type: { 
    type: String, 
    required: true, 
    enum: ['cash', 'bank', 'credit', 'investment', 'other'],
    default: 'bank'
  },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
accountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account; 