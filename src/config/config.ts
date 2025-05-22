import mongoose from 'mongoose';

const connectDB = (url: string) => (mongoose.connect(url));

export {connectDB};
