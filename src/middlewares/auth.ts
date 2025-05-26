import jwt from 'jsonwebtoken';
import User from '../models/users.ts';
import { ForbiddenError, UnauthorizedError } from '../errors/index.ts';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AuthenticatedRequest, UserPayload } from '../types/index.d.ts';
import env from '../config/env.ts';

// Create proper middleware types
type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Middleware to authenticate users
const authenticate: AuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    try {
      // Verify token
      const decoded : jwt.JwtPayload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

      // Find user
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new UnauthorizedError('User not found'));
      }
      
      // Attach user to request
      req.user = user as UserPayload;
      next();
    } catch (error) {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
  } catch (error) {
    next(error);
  }
};

const isAdmin: AuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authenticatedReq = req as AuthenticatedRequest;
  
  if (!authenticatedReq.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }
  
  if (!authenticatedReq.user.isAdmin) {
    next(new ForbiddenError('Administrator access required'));
    return;
  }
  
  next();
};

const authorizeRoles = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authenticatedReq = req as AuthenticatedRequest;
    // Since UserPayload only has isAdmin boolean, we'll use a simple role mapping
    const userRole = authenticatedReq.user.isAdmin ? 'admin' : 'user';
    if (!roles.includes(userRole)) {
      return next(new ForbiddenError(`Role ${userRole} is not authorized to access this resource`));
    }
    next();
  };
};

export { authenticate, isAdmin, authorizeRoles }; 