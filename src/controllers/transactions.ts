import Transaction from '../models/transactions.ts';
import { NotFoundError, BadRequestError } from '../errors/index.ts';
import { BaseController } from '../interfaces/BaseController.ts';
import Account from '../models/accounts.ts';
import s3Client from '../config/s3Config.js';
import env from '../config/env.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

class TransactionController extends BaseController {
  constructor() {
    super();
  }

  async getAll(req, res, next) {
    try {
      const { type, description, category, account, sort, fields, page, limit, numericFilters, startDate, endDate } = req.query;
      
      // Create query object and add user filter
      const queryObject : any = {
        user: req.user._id // Only return transactions belonging to the authenticated user
      };
      
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
      let query : any = Transaction.find(queryObject);

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
      const transaction = await Transaction.findOne({ 
        _id: id,
        user: req.user._id
      });
      
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
      let imageUrl = null;
      if (req.file) {
        // local upload (using multer)
        imageUrl = req.file.location;
      }
      else if(req.body.imgUrl) {
        // cloud upload (using uploadthing)
        imageUrl = req.body.imgUrl;
      }

      const account = await Account.findOne({
        _id: req.body.account,
        user: req.user._id
      });
      
      if (!account) {
        return next(new NotFoundError('Account not found or does not belong to you'));
      }
      
      // Check for sufficient funds for expense transactions
      if (req.body.type === 'expense' && account.balance < req.body.amount) {
        return next(new BadRequestError('Insufficient funds'));
      }
      
      // Create the transaction
      const transaction = new Transaction({
        ...req.body,
        imgUrl: imageUrl,
        user: req.user._id
      });
      
      await transaction.save();
      // Update account balance
      if (transaction.type === 'income') {
        account.balance += transaction.amount;
      } else if (transaction.type === 'expense') {
        account.balance -= transaction.amount;
      }
      
      await account.save();
      
      res.status(201).json({ transaction });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, description, category, date, type } = req.body;
      
      // Find transaction and ensure it belongs to the authenticated user
      const transaction = await Transaction.findOne({
        _id: id,
        user: req.user._id
      });
      
      if (!transaction) {
        return next(new NotFoundError('Transaction not found'));
      }
      
      // If amount or type changed, update account balance
      const amountChanged = amount && amount !== transaction.amount;
      const typeChanged = type && type !== transaction.type;
      
      if (amountChanged || typeChanged) {
        // Make sure the account belongs to the user
        const account = await Account.findOne({
          _id: transaction.account,
          user: req.user._id
        });
        
        if (!account) {
          return next(new NotFoundError('Account not found or does not belong to you'));
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
      
      // Find transaction and ensure it belongs to the authenticated user
      const transaction = await Transaction.findOne({
        _id: id,
        user: req.user._id
      });
      
      if (!transaction) {
        return next(new NotFoundError('Transaction not found'));
      }
      
      // Check if already deleted
      if (transaction.isDeleted) {
        return next(new BadRequestError('Transaction is already deleted'));
      }
      
      // Update account balance
      const account = await Account.findOne({
        _id: transaction.account,
        // user: req.user._id
      });
      
      if (!account) {
        return next(new NotFoundError('Account not found or does not belong to you'));
      }
      
      if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      } else {
        account.balance += transaction.amount;
      }
      
      await account.save();
      
      // Delete image from s3 if there is one
      if (transaction.imgUrl) {
        // get only the key from the url
        const lastSlashIndex = transaction.imgUrl.lastIndexOf('/');
        const key = transaction.imgUrl.substring(lastSlashIndex + 1);

        const params = {
          Bucket: env.AWS_S3_BUCKET_NAME,
          Key: key
        };
        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
      }

      await transaction.softDelete();

      // Soft delete
      res.status(200).json({ message: 'Transaction soft deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
  
  async restore(req, res, next) {
    try {
      // Set includeDeleted flag to allow finding deleted items
      const query : any = Transaction.findOne({
        _id: req.params.id,
        user: req.user._id
      });
      query.includeDeleted = true;
      
      const transaction = await query;
      if (!transaction) {
        return next(new NotFoundError('Transaction not found'));
      }
      
      if (!transaction.isDeleted) {
        return next(new BadRequestError('Transaction is not deleted'));
      }
      
      // Update account balance
      const account = await Account.findOne({
        _id: transaction.account,
        user: req.user._id
      });
      
      if (!account) {
        return next(new NotFoundError('Account not found or does not belong to you'));
      }
      
      if (transaction.type === 'income') {
        account.balance += transaction.amount;
      } else {
        if (account.balance < transaction.amount) {
          return next(new BadRequestError('Insufficient funds to restore this transaction'));
        }
        account.balance -= transaction.amount;
      }
      
      await account.save();
      await transaction.restore();
      res.status(200).json({ message: 'Transaction restored successfully', transaction });
    } catch (error) {
      next(error);
    }
  }
  
  async getDeleted(req, res, next) {
    try {
      // Only find deleted transactions belonging to the authenticated user
      const deletedTransactions = await Transaction.findDeleted({ user: req.user._id });
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
      const { id } = req.params;
      
      // First check if the account belongs to the user
      const accountExists = await Account.findOne({
        _id: id,
        user: req.user._id
      });
      
      if (!accountExists) {
        return next(new NotFoundError('Account not found or does not belong to you'));
      }
      
      // Find transactions for this account that belong to the authenticated user
      const transactions = await Transaction.find({ 
        account: id,
        user: req.user._id
      }).sort('-date');
      
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
      const { id } = req.params;
      
      // Find transactions for this category that belong to the authenticated user
      const transactions = await Transaction.find({ 
        category: id,
        user: req.user._id
      }).sort('-date');
      
      res.status(200).json({ 
        transactions,
        count: transactions.length
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== Admin-only methods ====================

  async getAllAdmin(req, res, next) {
    try {
      const { type, user, account, category, startDate, endDate, page, limit, sort } = req.query;
      
      // Create query object without user filter (admin can see all)
      const queryObject : any = {};
      
      // Optional filters
      if (user) {
        queryObject.user = user;
      }
      
      if (type) {
        queryObject.type = type;
      }
      
      if (account) {
        queryObject.account = account;
      }
      
      if (category) {
        queryObject.category = category;
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

      // Pagination
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 50;
      const skip = (pageNumber - 1) * limitNumber;
      
      query = query.skip(skip).limit(limitNumber);
      
      // Populate user, account and category information
      query = query.populate('user', 'username email firstName lastName')
                   .populate('account', 'name type')
                   .populate('category', 'name type');
      
      // Execute query
      const transactions = await query;
      
      // Count total documents for pagination
      const totalDocuments = await Transaction.countDocuments(queryObject);
      
      res.status(200).json({
        transactions,
        count: transactions.length,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalDocuments / limitNumber),
        total: totalDocuments
      });
    } catch (error) {
      next(error);
    }
  }

  async getByIdAdmin(req, res, next) {
    try {
      const { id } = req.params;
      
      // Find transaction without user filter
      const transaction = await Transaction.findById(id)
        .populate('user', 'username email firstName lastName')
        .populate('account', 'name type')
        .populate('category', 'name type');
      
      if (!transaction) {
        return next(new NotFoundError('Transaction not found'));
      }
      
      res.status(200).json({ transaction });
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req, res, next) {
    try {
      // Check if the account exists
      const account = await Account.findById(req.body.account);
      
      if (!account) {
        return next(new NotFoundError('Account not found'));
      }
      
      // Check if user exists
      const User = require('../models/users.ts');
      const user = await User.findById(req.body.user);
      
      if (!user) {
        return next(new NotFoundError('User not found'));
      }
      
      // Check for sufficient funds for expense transactions
      if (req.body.type === 'expense' && account.balance < req.body.amount) {
        return next(new BadRequestError('Insufficient funds'));
      }
      
      // Create the transaction
      const transaction = new Transaction(req.body);
      await transaction.save();
      
      // Update account balance
      if (transaction.type === 'income') {
        account.balance += transaction.amount;
      } else if (transaction.type === 'expense') {
        account.balance -= transaction.amount;
      }
      
      await account.save();
      
      res.status(201).json({ transaction });
    } catch (error) {
      next(error);
    }
  }

  async updateAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, description, category, date, type, user, account } = req.body;
      
      // Find transaction without user filter
      const transaction = await Transaction.findById(id);
      
      if (!transaction) {
        return next(new NotFoundError('Transaction not found'));
      }
      
      // If amount, type or account changed, update account balances
      const amountChanged = amount && amount !== transaction.amount;
      const typeChanged = type && type !== transaction.type;
      const accountChanged = account && account !== transaction.account.toString();
      
      if (amountChanged || typeChanged || accountChanged) {
        // Handle old account
        const oldAccount = await Account.findById(transaction.account);
        
        if (oldAccount) {
          // Revert old transaction effect
          if (transaction.type === 'income') {
            oldAccount.balance -= transaction.amount;
          } else {
            oldAccount.balance += transaction.amount;
          }
          await oldAccount.save();
        }
        
        // Handle new account if changed
        const newAccount = accountChanged 
          ? await Account.findById(account) 
          : oldAccount;
        
        if (!newAccount) {
          return next(new NotFoundError('New account not found'));
        }
        
        // Apply new transaction effect
        const newType = type || transaction.type;
        const newAmount = amount || transaction.amount;
        
        if (newType === 'income') {
          newAccount.balance += newAmount;
        } else {
          if (newAccount.balance < newAmount) {
            return next(new BadRequestError('Insufficient funds in the new account'));
          }
          newAccount.balance -= newAmount;
        }
        
        await newAccount.save();
      }
      
      // Update transaction
      const updatedFields : any = {};
      if (amount) updatedFields.amount = amount;
      if (description) updatedFields.description = description;
      if (category) updatedFields.category = category;
      if (date) updatedFields.date = date;
      if (type) updatedFields.type = type;
      if (user) updatedFields.user = user;
      if (account) updatedFields.account = account;
      
      const updatedTransaction = await Transaction.findByIdAndUpdate(
        id,
        updatedFields,
        { new: true, runValidators: true }
      ).populate('user', 'username email')
        .populate('account', 'name type')
        .populate('category', 'name type');
      
      res.status(200).json({ transaction: updatedTransaction });
    } catch (error) {
      next(error);
    }
  }

  async deleteAdmin(req, res, next) {
    try {
      const { id } = req.params;
      
      // Find transaction without user filter
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
      res.status(200).json({ 
        message: 'Transaction soft deleted successfully',
        transactionId: transaction._id
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.findById(id);
      
      if (!transaction) {
        return next(new NotFoundError('Transaction not found'));
      }
      
      await transaction.restore();
      res.status(200).json({ message: 'Transaction restored successfully', transaction });
    } catch (error) {
      next(error);
    }
  }
}

export default TransactionController;