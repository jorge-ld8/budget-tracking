import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import type { IUser, IUserModel } from '../types/models/user.types.ts';
import { CURRENCIES } from '../utils/constants.ts'; 

const userSchema = new mongoose.Schema<IUser>({
  username: {type: String, required: true, unique: true},
  email: {type: String, required: true, unique: true, validate: {
    validator: (value: string) => validator.isEmail(value),
    message: 'Invalid email address'
  }},
  password: {type: String, required: true},
  firstName: {type: String, required: true, trim: true, minlength: 3, maxlength: 30},
  lastName: {type: String, required: true, trim: true, minlength: 3, maxlength: 30},
  currency: {type: String, required: true, enum: {values: CURRENCIES, message: 'Invalid currency. {VALUE} is not supported.'} },
  isAdmin: {type: Boolean, default: false},
  createdAt: {type: Date, default: Date.now},
  isDeleted: {type: Boolean, default: false, index: true}
}, {timestamps: true});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function(): string {
  return jwt.sign(
    { id: this._id, username: this.username },
     process.env.JWT_SECRET || '',
     { expiresIn: String(process.env.JWT_EXPIRES_IN) || '1h' }
  );
};

// Create soft delete methods
userSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

userSchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};

// Create a mongoose query middleware that by default filters out deleted records
userSchema.pre(/^find/, function(next) {
  // In case you want to include deleted documents in some specific queries,
  // you can set this.includeDeleted = true in your query
  if ((this as any).includeDeleted !== true) {
    (this as any).where({ isDeleted: false });
  }
  next();
});

// Add a static method to find deleted documents when needed
userSchema.statics.findDeleted = function(query = {}) {
  const queryObj = this.find({...query, isDeleted: true});
  (queryObj as any).includeDeleted = true;
  return queryObj;
};

// Override the countDocuments to respect the isDeleted filter
userSchema.statics.countDocuments = function(query: any = {}, options: { includeDeleted?: boolean } = {}) {
  // Allow override of isDeleted behavior through options
  if (options && options.includeDeleted) {
    // Don't add isDeleted filter if explicitly asked to include deleted items
    return mongoose.Model.countDocuments.call(this, query, options);
  }
  
  // Otherwise filter out deleted documents by default
  if (!query.hasOwnProperty('isDeleted')) {
    query.isDeleted = false;
  }
  return mongoose.Model.countDocuments.call(this, query, options);
};

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - currency
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         username:
 *           type: string
 *           description: User's unique username
 *         email:
 *           type: string
 *           description: User's email address
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         currency:
 *           type: string
 *           enum: [USD, EUR, GBP, CAD, AUD, NZD, CHF, JPY, CNY, INR, BRL, ARS, CLP, COP, MXN, PEN, PYG, UYU, VND, ZAR]
 *           description: User's preferred currency
 *         isAdmin:
 *           type: boolean
 *           description: Whether the user has administrator privileges
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Update timestamp
 *         isDeleted:
 *           type: boolean
 *           description: Whether the user is soft deleted
 */
const User = mongoose.model<IUser, IUserModel>('User', userSchema);
export default User;

