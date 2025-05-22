import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import type { IBudgetSchema, IBudgetModel } from '../types/models/budgets.types.ts';
import { BUDGET_TYPES } from '../utils/constants.ts';
const budgetSchema = new Schema<IBudgetSchema>({
  amount: { type: Number, required: true },
  period: { type: String, required: true, enum: BUDGET_TYPES },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isRecurring: { type: Boolean, default: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, {timestamps: true});

// Create soft delete methods
budgetSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

budgetSchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};

// Create a mongoose query middleware that by default filters out deleted records
// This automatically applies to find, findOne, findById, etc.
budgetSchema.pre(/^find/, function(next) {
  (this as any).where({ isDeleted: false });
  next();
});

// Add a static method to find deleted documents when needed
budgetSchema.statics.findDeleted = function(query = {}) {
  const queryObj = this.find({...query, isDeleted: true});
  queryObj.includeDeleted = true;
  return queryObj;
};


// Override the countDocuments to respect the isDeleted filter
budgetSchema.statics.countDocuments = function(query = {}, options = {}) {
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

const Budget = mongoose.model<IBudgetSchema, IBudgetModel>('Budget', budgetSchema);

export default Budget;
