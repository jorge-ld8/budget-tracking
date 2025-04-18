require('dotenv').config();

const connectDB = require('./config/config');
const User = require('./src/models/users.ts');

const MONGO_URI = process.env.MONGO_URI;

connectDB(MONGO_URI);