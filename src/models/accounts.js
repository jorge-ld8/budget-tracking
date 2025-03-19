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
  updatedAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false, index: true }
});

// Update the updatedAt field before saving
accountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create soft delete methods
accountSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

accountSchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};

// Create a mongoose query middleware that by default filters out deleted records
// This automatically applies to find, findOne, findById, etc.
accountSchema.pre(/^find/, function(next) {
  // In case you want to include deleted documents in some specific queries,
  // you can set this.includeDeleted = true in your query
  if (this.includeDeleted !== true) {
    // By default exclude deleted documents
    this.where({ isDeleted: false });
  }
  next();
});

// Add a static method to find deleted documents when needed
accountSchema.statics.findDeleted = function(query = {}) {
  return this.find({ ...query, isDeleted: true });
};

// Add a static method to find both deleted and non-deleted
accountSchema.statics.findWithDeleted = function(query = {}) {
  const self = this;
  self.includeDeleted = true;
  return self.find(query);
};

// Override the countDocuments to respect the isDeleted filter
accountSchema.statics.countDocuments = function(query = {}, options = {}) {
  if (!query.hasOwnProperty('isDeleted')) {
    query.isDeleted = false;
  }
  return mongoose.Model.countDocuments.call(this, query, options);
};

const Account = mongoose.model('Account', accountSchema);

module.exports = Account; 