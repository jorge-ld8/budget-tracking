import { Request } from 'express';
import { ObjectId } from 'mongodb';
// Define the structure of the user object attached by auth middleware
export interface UserPayload {
  _id: ObjectId;
  username: string;
  email: string;
  isAdmin: boolean;
}

// Extend the default Express Request type
export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

// You can add other global types here if needed
