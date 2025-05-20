import mongoose from 'mongoose';
import env from './env.ts';

const connectDB = (url: string) => (mongoose.connect(url));

export default {connectDB, NODE_ENV: env.NODE_ENV};
