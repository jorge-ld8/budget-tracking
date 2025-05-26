import mongoose, { type Query } from 'mongoose';
import { Schema } from 'mongoose';
import type { ITransactionModel, ITransactionSchema } from '../types/models/transaction.types.ts';
import { TRANSACTION_TYPES } from '../utils/constants.ts';

const transactionSchema = new Schema<ITransactionSchema>({
  amount: { type: Number, required: true },
  type: { type: String, required: true, enum: TRANSACTION_TYPES },
  description: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  imgUrl: { type: String, required: false },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform(doc, ret) {
      if (ret.date) {
        const date = new Date(ret.date);
        ret.date = new Date(date.getTime() + (4 * 60 * 60 * 1000));
      }
      return ret;
    }
  },
});

// Create soft delete methods
transactionSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

transactionSchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};

// Create a mongoose query middleware that by default filters out deleted records
// This automatically applies to find, findOne, findById, etc.
transactionSchema.pre(/^find/, function(this: Query<ITransactionSchema[], ITransactionSchema>, next) {
  this.where({ isDeleted: false });
  next();
});

// Add a static method to find deleted documents when needed
transactionSchema.statics.findDeleted = function(query: any = {}) {
  const queryObj = this.find({...query, isDeleted: true});
  queryObj.includeDeleted = true;
  return queryObj;
};

// Override the countDocuments to respect the isDeleted filter
transactionSchema.statics.countDocuments = function(query: any  = {}, options: any = {}) {
  // Allow override of isDeleted behavior through options
  if (options?.includeDeleted) {
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
 *     Transaction:
 *       type: object
 *       required:
 *         - amount
 *         - type
 *         - description
 *         - category
 *         - account
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *           example: 60d21b4667d0d8992e610c89
 *         amount:
 *           type: number
 *           description: Transaction amount
 *           example: 50.75
 *         type:
 *           type: string
 *           enum: [income, expense]
 *           description: Transaction type
 *           example: expense
 *         description:
 *           type: string
 *           description: Transaction description
 *           example: Grocery shopping
 *         date:
 *           type: string
 *           format: date-time
 *           description: Transaction date
 *           example: 2023-06-15T10:30:00Z
 *         category:
 *           type: string
 *           description: Reference to category ID
 *           example: 60d21b4667d0d8992e610c85
 *         account:
 *           type: string
 *           description: Reference to account ID
 *           example: 60d21b4667d0d8992e610c86
 *         user:
 *           type: string
 *           description: Reference to user ID
 *           example: 60d21b4667d0d8992e610c84
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: 2023-06-15T10:30:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Update timestamp
 *           example: 2023-06-15T10:30:00Z
 *         isDeleted:
 *           type: boolean
 *           description: Whether the transaction has been soft deleted
 *           default: false
 *           example: false
 */

const Transaction = mongoose.model<ITransactionSchema, ITransactionModel>('Transaction', transactionSchema);

export default Transaction;