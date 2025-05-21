import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import type { ICategorySchema, ICategoryModel } from '../types/models/categories.types.ts';
import { TRANSACTION_TYPES as CATEGORY_TYPES } from '../utils/constants.ts';

const categorySchema = new Schema<ICategorySchema>({
  name: { type: String, required: true, trim: true, unique: true },
  type: { type: String, required: true, enum: CATEGORY_TYPES },
  icon: { type: String, default: 'default-icon' },
  color: { type: String, default: '#000000' },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, {timestamps: true});

// Create soft delete methods
categorySchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

categorySchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};

// Create a mongoose query middleware that by default filters out deleted records
// This automatically applies to find, findOne, findById, etc.
categorySchema.pre(/^find/, function(next) {
  // In case you want to include deleted documents in some specific queries,
  // you can set this.includeDeleted = true in your query
  if ((this as any).includeDeleted !== true) {
    // By default exclude deleted documents
    (this as any).where({ isDeleted: false });
  }
  next();
});

// Add a static method to find deleted documents when needed
categorySchema.statics.findDeleted = function(query = {}) {
  const queryObj = this.find({...query, isDeleted: true});
  queryObj.includeDeleted = true;
  return queryObj;
};

// Override the countDocuments to respect the isDeleted filter
categorySchema.statics.countDocuments = function(query = {}, options = {}) {
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

const Category = mongoose.model<ICategorySchema, ICategoryModel>('Category', categorySchema);

export default Category;
