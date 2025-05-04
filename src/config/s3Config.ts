import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import env from './env.ts';

// Initialize S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
} as S3ClientConfig);

export default s3Client;
