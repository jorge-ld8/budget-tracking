import { Request } from 'express';

// Define the structure of the user object attached by auth middleware
// Add other relevant fields like role, email etc. as needed
export interface UserPayload {
  _id: string; // Assuming _id is attached as a string or can be converted
  // role?: 'admin' | 'user'; // Example: Add role if used for authorization
  // email?: string;
}

// Extend the default Express Request type
export interface AuthenticatedRequest extends Request {
  user: UserPayload; // Add the user property
}

// You can add other global types here if needed
