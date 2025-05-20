import dotenv from 'dotenv';
import path from 'path';
import env from 'env-var';
import * as ms from 'ms';

// Determine which .env file to use
const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = NODE_ENV === 'development' 
  ? '.env.development' 
  : (NODE_ENV === 'production' ? '.env.production' : '.env');

// Load environment variables
dotenv.config({ 
  path: path.resolve(process.cwd(), envFile) 
});


// export default {
//   NODE_ENV,
//   PORT: process.env.PORT || 5000,
//   MONGO_URI: process.env.MONGO_URI,
//   JWT_SECRET: process.env.JWT_SECRET,
//   JWT_LIFETIME: process.env.JWT_LIFETIME || '1d',
//   AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
//   AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
//   AWS_REGION: process.env.AWS_REGION,
//   AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME
// };

export default {
  NODE_ENV,
  PORT: env.get('PORT').required().asInt(),
  MONGO_URI: env.get('MONGO_URI').required().asString(),
  JWT_SECRET: env.get('JWT_SECRET').required().asString(),
  JWT_EXPIRES_IN: env.get('JWT_EXPIRES_IN').required().asString() as ms.StringValue,
  AWS_ACCESS_KEY_ID: env.get('AWS_ACCESS_KEY_ID').required().asString(),
  AWS_SECRET_ACCESS_KEY: env.get('AWS_SECRET_ACCESS_KEY').required().asString(),
  AWS_REGION: env.get('AWS_REGION').required().asString(),
  AWS_S3_BUCKET_NAME: env.get('AWS_S3_BUCKET_NAME').required().asString(),
}

