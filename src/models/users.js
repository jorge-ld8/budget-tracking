const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  email: {type: String, required: true, unique: true, match: [/.+\@.+\..+/, 'Please fill a valid email address']},
  password: {type: String, required: true},
  firstName: {type: String, required: true, trim: true, minlength: 3, maxlength: 30},
  lastName: {type: String, required: true, trim: true, minlength: 3, maxlength: 30},
  currency: {type: String, required: true, enum: {values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF', 'JPY', 'CNY', 'INR', 'BRL', 'ARS', 'CLP', 'COP', 'MXN', 'PEN', 'PYG', 'UYU', 'VND', 'ZAR'], message: 'Invalid currency. {VALUE} is not supported.'} },
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now},
  isDeleted: {type: Boolean, default: false, index: true}
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, username: this.username },
    process.env.JWT_SECRET, // You'll need to set this in your environment
    { expiresIn: '1d' } // Token expiration time
  );
};

// Create soft delete methods
userSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

userSchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};

// Create a mongoose query middleware that by default filters out deleted records
// This automatically applies to find, findOne, findById, etc.
userSchema.pre(/^find/, function(next) {
  // In case you want to include deleted documents in some specific queries,
  // you can set this.includeDeleted = true in your query
  if (this.includeDeleted !== true) {
    this.where({ isDeleted: false });
  }
  next();
});

// Add a static method to find deleted documents when needed
userSchema.statics.findDeleted = function(query = {}) {
  const queryObj = this.find({...query, isDeleted: true});
  queryObj.includeDeleted = true; // Set it on the query object instead
  return queryObj;
};

// Add a static method to find both deleted and non-deleted
userSchema.statics.findWithDeleted = function(query = {}) {
  const self = this;
  self.includeDeleted = true;
  return self.find(query);
};

// Override the countDocuments to respect the isDeleted filter
userSchema.statics.countDocuments = function(query = {}, options = {}) {
  // Allow override of isDeleted behavior through options
  if (options && options.includeDeleted) {
    // Don't add isDeleted filter if explicitly asked to include deleted items
    return mongoose.Model.countDocuments.call(this, query, options);
  }
  
  // Otherwise filter out deleted documents by default
  if (!query.hasOwnProperty('isDeleted')) {
    query.isDeleted = false;
  }
  return mongoose.Model.countDocuments.call(this, query, options);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
