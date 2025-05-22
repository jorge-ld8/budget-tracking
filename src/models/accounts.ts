import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import type { IAccountSchema, IAccountModel } from '../types/models/accounts.types.ts';
import { ACCOUNT_TYPES } from '../utils/constants.ts';

const accountSchema = new Schema<IAccountSchema>({
  name: { type: String, required: true, trim: true, unique: true },
  balance: { type: Number, required: true, default: 0 },
  type: { 
    type: String, 
    required: true, 
    enum: ACCOUNT_TYPES,
    default: 'bank'
  },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, {timestamps: true});


// Create soft delete methods
accountSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

accountSchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};


accountSchema.pre(/^find/, function(next) {
  (this as any).where({ isDeleted: false });
  next();
});

// Add a static method to find deleted documents when needed
accountSchema.statics.findDeleted = function(query = {}) {
  const queryObj = this.find({...query, isDeleted: true});
  queryObj.includeDeleted = true;
  return queryObj;
};

// Override the countDocuments to respect the isDeleted filter
accountSchema.statics.countDocuments = function(query = {}, options = {}) {
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
 *     Account:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the account
 *           example: 60d21b4667d0d8992e610c85
 *         name:
 *           type: string
 *           description: Account name
 *           example: Checking Account
 *         balance:
 *           type: number
 *           description: Current account balance
 *           default: 0
 *           example: 1250.75
 *         type:
 *           type: string
 *           enum: [cash, bank, credit, investment, other]
 *           description: Type of account
 *           default: bank
 *           example: bank
 *         description:
 *           type: string
 *           description: Optional account description
 *           example: My primary checking account
 *         isActive:
 *           type: boolean
 *           description: Whether the account is active
 *           default: true
 *           example: true
 *         user:
 *           type: string
 *           description: Reference to the user who owns this account
 *           example: 60d21b4667d0d8992e610c85
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the account was created
 *           example: 2023-04-15T09:12:28.291Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the account was last updated
 *           example: 2023-05-22T15:34:12.345Z
 *         isDeleted:
 *           type: boolean
 *           description: Whether the account has been soft deleted
 *           default: false
 *           example: false
 */
const Account = mongoose.model<IAccountSchema, IAccountModel>('Account', accountSchema);

export default Account;
