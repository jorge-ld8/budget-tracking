import mongoose from 'mongoose';
import env from './env.js';

const connectDB = (url) => (mongoose.connect(url));

export default {connectDB, NODE_ENV: env.NODE_ENV};
