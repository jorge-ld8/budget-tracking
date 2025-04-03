const mongoose = require('mongoose');
const dotenv = require('dotenv');

const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = NODE_ENV === 'development' ? '.env.development' : (NODE_ENV === 'production' ? '.env.production' : '.env');
dotenv.config({ path: envFile });


const connectDB = (url) => (mongoose.connect(url));

module.exports = {connectDB, NODE_ENV};
