import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { IBudget, IBudgetModel } from '../types/models/budgets.types';

const budgetSchema = new Schema<IBudget>({
  amount: { type: Number, required: true },
  period: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isRecurring: { type: Boolean, default: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, {timestamps: true});

// Update the updatedAt field before saving
budgetSchema.pre('save', function(next) {
  (this as any).updatedAt = Date.now();
  next();
});

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
  // In case you want to include deleted documents in some specific queries,
  // you can set this.includeDeleted = true in your query
  if ((this as any).includeDeleted !== true) {
    // By default exclude deleted documents
    (this as any).where({ isDeleted: false });
  }
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

const Budget = mongoose.model<IBudget, IBudgetModel>('Budget', budgetSchema);

export { Budget, IBudget }; 