import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import s3Client from '../config/s3Config.ts';
import env from '../config/env.ts';
import type { Request } from 'express';
import { BadRequestError } from '../errors/BadRequestError.ts';

// Ensure upload directory exists
const uploadDir = path.join(import.meta.url, '../uploads/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const s3Storage = multerS3({
  s3: s3Client,
  bucket: env.AWS_S3_BUCKET_NAME,
  acl: 'public-read',
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  }
});

// File filter for images
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    throw new BadRequestError('Invalid file type. Only JPEG, JPG and PNG files are allowed.');
  }
};

// Multer middleware
const upload = multer({
  storage: s3Storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

export default upload;
// VITE_API_URL=https://budget-tracking-docker.onrender.com