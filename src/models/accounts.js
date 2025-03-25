const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  balance: { type: Number, required: true, default: 0 },
  type: { 
    type: String, 
    required: true, 
    enum: ['cash', 'bank', 'credit', 'investment', 'other'],
    default: 'bank'
  },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, {timestamps: true});

// Update the updatedAt field before saving
accountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create soft delete methods
accountSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

accountSchema.methods.restore = function() {
  this.isDeleted = false;
  return this.save();
};

// Create a mongoose query middleware that by default filters out deleted records
// This automatically applies to find, findOne, findById, etc.
accountSchema.pre(/^find/, function(next) {
  // In case you want to include deleted documents in some specific queries,
  // you can set this.includeDeleted = true in your query
  if (this.includeDeleted !== true) {
    // By default exclude deleted documents
    this.where({ isDeleted: false });
  }
  next();
});

// Add a static method to find deleted documents when needed
accountSchema.statics.findDeleted = function(query = {}) {
  const queryObj = this.find({...query, isDeleted: true});
  queryObj.includeDeleted = true;
  return queryObj;
};

// Add a static method to find both deleted and non-deleted
accountSchema.statics.findWithDeleted = function(query = {}) {
  const self = this;
  self.includeDeleted = true;
  return self.find(query);
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
const Account = mongoose.model('Account', accountSchema);

module.exports = Account; 