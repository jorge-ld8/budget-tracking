const mongoose = require('mongoose');

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

const User = mongoose.model('User', userSchema);

module.exports = User;