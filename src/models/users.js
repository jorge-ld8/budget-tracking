const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  email: {type: String, required: true, unique: true, match: [/.+\@.+\..+/, 'Please fill a valid email address']},
  password: {type: String, required: true},
  firstName: {type: String, required: true, trim: true, minlength: 3, maxlength: 30},
  lastName: {type: String, required: true, trim: true, minlength: 3, maxlength: 30},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now},
});

const User = mongoose.model('User', userSchema);

module.exports = User;