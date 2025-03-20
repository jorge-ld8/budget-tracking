const jwt = require('jsonwebtoken');
const User = require('../models/users');
const { createCustomError } = require('../errors/custom-error');

// Middleware to authenticate users
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createCustomError('Authentication required', 401));
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(createCustomError('Authentication required', 401));
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(createCustomError('User not found', 401));
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      return next(createCustomError('Invalid or expired token', 401));
    }
  } catch (error) {
    next(error);
  }
};

// Optional: middleware to check specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createCustomError(`Role ${req.user.role} is not authorized to access this resource`, 403));
    }
    next();
  };
};

module.exports = { authenticate, authorizeRoles }; 