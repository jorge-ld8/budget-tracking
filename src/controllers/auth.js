const User = require('../models/users');
const { BadRequestError, UnauthorizedError, ConflictError } = require('../errors');
const BaseController = require('../interfaces/BaseController');

class AuthController extends BaseController {
  constructor() {
    super();
  }

  async register(req, res, next) {
    try {
      const { username, email, password, firstName, lastName, currency } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return next(new BadRequestError('User with this email or username already exists'));
      }
      
      // Create new user
      const user = new User({
        username,
        email,
        password, // Will be hashed by the pre-save hook
        firstName,
        lastName,
        currency: currency || 'USD'
      });
      
      await user.save();
      
      // Generate token
      const token = user.generateAuthToken();
      
      // Return user info without password
      const userObj = user.toObject();
      delete userObj.password;
      
      res.status(201).json({
        token,
        user: userObj
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Check if email and password are provided
      if (!email || !password) {
        return next(new BadRequestError('Email and password are required'));
      };

      console.log('req.body', req.body);
      // Check if user exists
      const user = await User.findOne({ email });
      console.log('user', user);
      if (!user) {
        return next(new UnauthorizedError('Invalid credentials'));
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return next(new UnauthorizedError('Invalid credentials'));
      }
      
      // Update last login
      user.lastLogin = Date.now();
      await user.save();
      
      // Generate token
      const token = user.generateAuthToken();
      
      // Return user info without password
      const userObj = user.toObject();
      delete userObj.password;
      
      res.status(200).json({
        token,
        user: userObj
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res) {
    // The user is attached to req by the auth middleware
    const userObj = req.user.toObject();
    delete userObj.password;
    
    res.status(200).json({
      success: true,
      user: userObj
    });
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;
      
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        const error = createCustomError('Current password is incorrect', 401);
        return next(error);
      }
      
      // Update password
      user.password = newPassword;
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    // For JWT, client-side should remove the token
    // Here we can add any server-side cleanup if needed
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

module.exports = AuthController;
