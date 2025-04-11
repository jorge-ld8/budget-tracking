const mongoose = require('mongoose');
const env = require('./env');

const connectDB = (url) => (mongoose.connect(url));

module.exports = {connectDB, NODE_ENV: env.NODE_ENV};
