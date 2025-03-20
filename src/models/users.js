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

const User = mongoose.model('User', userSchema);
module.exports = User;
