import jwt from 'jsonwebtoken';
import User from '../models/users.ts';
import { UnauthorizedError, ForbiddenError } from '../errors/index.ts';
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest, UserPayload } from '../types/index.d.ts';


// Middleware to authenticate users
const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    try {
      // Verify token
      const decoded : any = jwt.verify(token, process.env.JWT_SECRET as string);
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

const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) : Promise<any> => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }
  
  if (!req.user.isAdmin) {
    return next(new ForbiddenError('Administrator access required'));
  }
  
  next();
};

const authorizeRoles = (...roles: string[]) => {
  return (req: Request & { user: any }, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role ${req.user.role} is not authorized to access this resource`));
    }
    next();
  };
};

export { authenticate, isAdmin, authorizeRoles }; 