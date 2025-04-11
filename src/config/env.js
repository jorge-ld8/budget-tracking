const dotenv = require('dotenv');
const path = require('path');

// Determine which .env file to use
const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = NODE_ENV === 'development' 
  ? '.env.development' 
  : (NODE_ENV === 'production' ? '.env.production' : '.env');

// Load environment variables
dotenv.config({ 
  path: path.resolve(process.cwd(), envFile) 
});

module.exports = {
  NODE_ENV,
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_LIFETIME: process.env.JWT_LIFETIME || '1d',
  // Add other commonly used environment variables here
  // AWS S3 settings
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME
};
