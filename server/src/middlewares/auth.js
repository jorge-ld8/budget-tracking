const jwt = require('jsonwebtoken');
const User = require('../models/users.ts');
const { UnauthorizedError, ForbiddenError } = require('../errors');

// Middleware to authenticate users
const authenticate = async (req, res, next) => {
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new UnauthorizedError('User not found'));
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to check if user is an administrator
const isAdmin = async (req, res, next) => {
  // First ensure the user is authenticated
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }
  
  // Check if the user has admin privileges
  if (!req.user.isAdmin) {
    return next(new ForbiddenError('Administrator access required'));
  }
  
  next();
};

// Optional: middleware to check specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role ${req.user.role} is not authorized to access this resource`));
    }
    next();
  };
};

module.exports = { authenticate, isAdmin, authorizeRoles }; 