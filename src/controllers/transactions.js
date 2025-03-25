const Transaction = require('../models/transactions');
const { NotFoundError, BadRequestError } = require('../errors');
const BaseController = require('../interfaces/BaseController');
const Account = require('../models/accounts');


class TransactionController extends BaseController {
  constructor() {
    super();
  }

  async getAll(req, res, next) {
    try {
      const { type, description, category, account, sort, fields, page, limit, numericFilters, startDate, endDate } = req.query;
      
      const queryObject = {};
      
      // Basic filters
      if (type) {
        queryObject.type = type;
      }
      
      if (description) {
        queryObject.description = { $regex: description, $options: 'i' };
      }
      
      if (category) {
        queryObject.category = category;
      }
      
      if (account) {
        queryObject.account = account;
      }
      
      // Date range filtering
      if (startDate || endDate) {
        queryObject.date = {};
        
        if (startDate) {
          queryObject.date.$gte = new Date(startDate);
        }
        
        if (endDate) {
          queryObject.date.$lte = new Date(endDate);
        }
      }
      
      // Numeric filters
      if (numericFilters) {
        const operatorMap = {
          '>': '$gt',
          '>=': '$gte',
          '<': '$lt',
          '<=': '$lte',
          '=': '$eq',
          '!=': '$ne'
        };
        const regex = /\b(<|>|>=|<=|=|!=)\b/g;
        let filters = numericFilters.replace(regex, (match) => `-${operatorMap[match]}-`);
        const options = ['amount'];
        filters = filters.split(',').forEach((item) => {
          const [field, operator, value] = item.split('-');
          if (options.includes(field)) {
            queryObject[field] = { [operator]: Number(value) };
          }
        });
      }

      // Build query
      let query = Transaction.find(queryObject);

      // Sorting
      if (sort) {
        const sortFields = sort.split(',').join(' ');
        query = query.sort(sortFields);
      } else {
        // Default sort by date (newest first)
        query = query.sort('-date');
      }

      // Field selection
      if (fields) {
        const fieldsList = fields.split(',').join(' ');
        query = query.select(fieldsList);
      }

      // Pagination
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;
      
      query = query.skip(skip).limit(limitNumber);
      
      // Execute query
      const transactions = await query;
      
      // Count total documents for pagination
      const totalDocuments = await Transaction.countDocuments(queryObject);
      
      res.status(200).json({
        transactions,
        count: transactions.length,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalDocuments / limitNumber)
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.findById(id);
      
      if (!transaction) {
        return next(new NotFoundError('Transaction not found'));
      }
      
      res.status(200).json({ transaction });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      // Update account balance
      const account = await Account.findById(transaction.account);
      
      if (!account) {
        return next(new NotFoundError('Account not found'));
      }

      if (account.user !== req.user._id) {
        return next(new BadRequestError('Account not found on current user'));
      }
      
      if (transaction.type === 'income') {
        account.balance += transaction.amount;
      } else if (transaction.type === 'expense') {
        if (account.balance < transaction.amount) {
          return next(new BadRequestError('Insufficient funds'));
        }
        account.balance -= transaction.amount;
      }
      
      await account.save();
      
      // Add user ID from authenticated user
      const transaction = new Transaction({
        ...req.body,
        user: req.user._id
      });
        
      await transaction.save();
      res.status(201).json({ transaction });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, description, category, date, type } = req.body;
      
      const transaction = await Transaction.findById(id);
      
      if (!transaction) {
        return next(new NotFoundError('Transaction not found'));
      }
      
      // If amount or type changed, update account balance
      const amountChanged = amount && amount !== transaction.amount;
      const typeChanged = type && type !== transaction.type;
      
      if (amountChanged || typeChanged) {
        const Account = require('../models/accounts');
        const account = await Account.findById(transaction.account);
        
        if (!account) {
          return next(new NotFoundError('Account not found'));
        }
        
        // Revert old transaction effect
        if (transaction.type === 'income') {
          account.balance -= transaction.amount;
        } else {
          account.balance += transaction.amount;
        }
        
        // Apply new transaction effect
        const newType = type || transaction.type;
        const newAmount = amount || transaction.amount;
        
        if (newType === 'income') {
          account.balance += newAmount;
        } else {
          if (account.balance < newAmount) {
            return next(new BadRequestError('Insufficient funds'));
          }
          account.balance -= newAmount;
        }
        
        await account.save();
      }
      
      // Update transaction
      const updatedTransaction = await Transaction.findByIdAndUpdate(
        id,
        { amount, description, category, date, type },
        { new: true, runValidators: true }
      );
      
      res.status(200).json({ transaction: updatedTransaction });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      // Find transaction
      const transaction = await Transaction.findById(id);
      
      if (!transaction) {
        return next(new NotFoundError('Transaction not found'));
      }
      
      // Check if already deleted
      if (transaction.isDeleted) {
        return next(new BadRequestError('Transaction is already deleted'));
      }
      
      // Update account balance
      const account = await Account.findById(transaction.account);
      
      if (account) {
        if (transaction.type === 'income') {
          account.balance -= transaction.amount;
        } else {
          account.balance += transaction.amount;
        }
        
        await account.save();
      }
      
      // Soft delete
      await transaction.softDelete();
      res.status(200).json({ message: 'Transaction soft deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
  
  async restore(req, res, next) {
    try {
      // Set includeDeleted flag to allow finding deleted items
      const query = Transaction.findById(req.params.id);
      query.includeDeleted = true;
      
      const transaction = await query;
      if (!transaction) {
        return next(new NotFoundError('Transaction not found'));
      }
      
      if (!transaction.isDeleted) {
        return next(new BadRequestError('Transaction is not deleted'));
      }
      
      // Update account balance
      const Account = require('../models/accounts');
      const account = await Account.findById(transaction.account);
      
      if (account) {
        if (transaction.type === 'income') {
          account.balance += transaction.amount;
        } else {
          if (account.balance < transaction.amount) {
            return next(new BadRequestError('Insufficient funds to restore this transaction'));
          }
          account.balance -= transaction.amount;
        }
        
        await account.save();
      } else {
        return next(new NotFoundError('Account not found'));
      }
      
      await transaction.restore();
      res.status(200).json({ message: 'Transaction restored successfully', transaction });
    } catch (error) {
      next(error);
    }
  }
  
  async getDeletedTransactions(req, res, next) {
    try {
      const deletedTransactions = await Transaction.findDeleted();
      res.status(200).json({ 
        deletedTransactions,
        count: deletedTransactions.length
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getByAccount(req, res, next) {
    try {
      const { accountId } = req.params;
      const transactions = await Transaction.find({ account: accountId }).sort('-date');
      
      res.status(200).json({ 
        transactions,
        count: transactions.length
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const transactions = await Transaction.find({ category: categoryId }).sort('-date');
      
      res.status(200).json({ 
        transactions,
        count: transactions.length
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TransactionController;
