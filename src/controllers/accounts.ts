import { NotFoundError, BadRequestError } from '../errors/index.ts';
import Account from '../models/accounts.ts';
import type { AccountController as IAccountController } from '../types/controllers.ts';

class AccountController implements IAccountController {
  constructor() {}

  async getAll(req, res) {
    const { type, name, sort, fields, page, limit, numericFilters } = req.query;

    // Add user filter to query object - only return accounts belonging to the authenticated user
    const queryObject : any = {
      user: req.user._id
    };
    
    if (type) {
      queryObject.type = type;
    }
    if (name) {
      queryObject.$or = [
        { name: { $regex: name, $options: 'i' } },
        { description: { $regex: name, $options: 'i' } }
      ];
    }
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
      const options = ['balance'];
      filters = filters.split(',').forEach((item) => {
        const [field, operator, value] = item.split('-');
        if (options.includes(field)) {
          queryObject[field] = { [operator]: Number(value) };
        }
      });
    }
    
    let query = Account.find(queryObject);

    if (sort) {
      const sortFields = sort.split(',').join(' ');
      query = query.sort(sortFields);
    }
    if (fields) {
      const fieldsList = fields.split(',').join(' ');
      query = query.select(fieldsList);
    }
    
    // Pagination
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;
    
    query = query.skip(skip).limit(limitNumber);
    
    const accounts = await query;
    
    // For total count, respect the includeDeleted parameter
    let countQuery = queryObject;
      // Normal count (middleware handles filtering)
    const totalDocuments = await Account.countDocuments(countQuery);
    res.status(200).json({ 
      accounts, 
      nbHits: accounts.length,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalDocuments / limitNumber)
    });
  }

  async getById(req, res, next) {
    const { id } = req.params;
    
    // Find account and ensure it belongs to the authenticated user
    const account = await Account.findOne({
      _id: id,
      user: req.user._id
    });
    
    if (!account) {
      return next(new NotFoundError('Account not found'));
    }
    
    res.status(200).json({ account });
  }

  async create(req, res) {
    const account = new Account({...req.body, user: req.user._id, balance: 0, isActive: true});
    await account.save();
    res.status(201).json({ account });
  }

  async delete(req, res, next) {
    const { id } = req.params;
    
    // Find account and ensure it belongs to the authenticated user
    const account = await Account.findOne({
      _id: id,
      user: req.user._id
    });
    
    if (!account) {
      return next(new NotFoundError('Account not found'));
    }
    
    // Check if already deleted
    if (account.isDeleted) {
      return next(new BadRequestError('Account is already deleted'));
    }
    
    await account.softDelete();
    res.status(200).json({ message: 'Account soft deleted successfully' });
  }

  async update(req, res, next) {
    const { id } = req.params;
    const { name, type, description, isActive } = req.body;
    
    // Find and update account, ensuring it belongs to the authenticated user
    const account = await Account.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { name, type, description, isActive }, 
      { new: true, runValidators: true }
    );
    
    if (!account) {
      return next(new NotFoundError('Account not found'));
    }
    
    res.status(200).json({ account });
  }

  async updateBalance(req, res, next) {
    const { id } = req.params;
    const { amount, operation } = req.body;
    
    if (!amount || !operation || !['add', 'subtract'].includes(operation)) {
      return next(new BadRequestError('Invalid request. Amount and operation (add/subtract) are required.'));
    }

    // Find account and ensure it belongs to the authenticated user
    const account = await Account.findOne({
      _id: id,
      user: req.user._id
    });
    
    if (!account) {
      return next(new NotFoundError('Account not found'));
    }
    
    // Prevent operations on deleted accounts
    if (account.isDeleted) {
      return next(new BadRequestError('Cannot update balance of a deleted account'));
    }

    if (operation === 'add') {
      account.balance += Number(amount);
    } else if (operation === 'subtract') {
      if (account.balance < amount) {
        return next(new BadRequestError('Insufficient funds'));
      }
      account.balance -= Number(amount);
    }

    await account.save();
    
    // Return only specific fields
    res.status(200).json({ 
      balance: account.balance,
      name: account.name,
      operation: operation,
      amount: Number(amount),
      timestamp: new Date()
    });
  }

  async toggleActive(req, res, next) {
    const { id } = req.params;
    
    // Find account and ensure it belongs to the authenticated user
    const account = await Account.findOne({
      _id: id,
      user: req.user._id
    });
    
    if (!account) {
      return next(new NotFoundError('Account not found'));
    }
    
    // Prevent toggling active status of deleted accounts
    if (account.isDeleted) {
      return next(new BadRequestError('Cannot change active status of a deleted account'));
    }

    account.isActive = !account.isActive;
    await account.save();
    res.status(200).json({ account });
  }

  async findByUser(req, res, next) {
    // We'll only allow users to find their own accounts
    // Instead of using the userId parameter, we'll use the authenticated user's ID
    const userId = req.user._id;
    
    const accounts = await Account.find({ user: userId });
    
    res.status(200).json({ accounts });
  }

  async restore(req, res, next) {
    // Set includeDeleted flag to allow finding deleted items
    const query : any = Account.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    query.includeDeleted = true;
    
    const account = await query;
    if (!account) {
      return next(new NotFoundError('Account not found'));
    }
    
    if (!account.isDeleted) {
      return next(new BadRequestError('Account is not deleted'));
    }
    
    await account.restore();
    res.status(200).json({ message: 'Account restored successfully', account });
  }

  async getDeletedAccounts(req, res) {
    // Only find deleted accounts belonging to the authenticated user
    const deletedAccounts = await Account.findDeleted({ user: req.user._id });
    
    res.status(200).json({ 
      deletedAccounts,
      count: deletedAccounts.length
    });
  }

  // ==================== Admin-only methods ====================

  async getAllAdmin(req, res, next) {
    try {
      const { type, user, name, sort, fields, page, limit, numericFilters } = req.query;
      
      // Create query object without user filter (admin can see all)
      const queryObject : any = {};
      
      // Optional filters
      if (user) {
        queryObject.user = user;
      }
      
      if (type) {
        queryObject.type = type;
      }
      
      if (name) {
        queryObject.$or = [
          { name: { $regex: name, $options: 'i' } },
          { description: { $regex: name, $options: 'i' } }
        ];
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
        const options = ['balance'];
        filters = filters.split(',').forEach((item) => {
          const [field, operator, value] = item.split('-');
          if (options.includes(field)) {
            queryObject[field] = { [operator]: Number(value) };
          }
        });
      }

      // Build query
      let query = Account.find(queryObject);

      // Sorting
      if (sort) {
        const sortFields = sort.split(',').join(' ');
        query = query.sort(sortFields);
      } else {
        // Default sort by creation date (newest first)
        query = query.sort('-createdAt');
      }

      // Field selection
      if (fields) {
        const fieldsList = fields.split(',').join(' ');
        query = query.select(fieldsList);
      }

      // Pagination
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 50;
      const skip = (pageNumber - 1) * limitNumber;
      
      query = query.skip(skip).limit(limitNumber);
      
      // Populate user information
      query = query.populate('user', 'username email firstName lastName');
      
      // Execute query
      const accounts = await query;
      
      // Count total documents for pagination
      const totalDocuments = await Account.countDocuments(queryObject);
      
      res.status(200).json({
        accounts,
        count: accounts.length,
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
      
      // Find account without user filter
      const account = await Account.findById(id)
        .populate('user', 'username email firstName lastName');
      
      if (!account) {
        return next(new NotFoundError('Account not found'));
      }
      
      res.status(200).json({ account });
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req, res, next) {
    try {
      // Check if user exists
      const User = require('../models/users.ts');
      const user = await User.findById(req.body.user);
      
      if (!user) {
        return next(new NotFoundError('User not found'));
      }
      
      // Create the account
      const account = new Account({
        ...req.body,
        balance: req.body.balance || 0,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true
      });
      
      await account.save();
      
      res.status(201).json({ account });
    } catch (error) {
      next(error);
    }
  }

  async updateAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { name, type, description, isActive, balance, user } = req.body;
      
      // Update account without user filter
      const updatedFields : any = {};
      if (name !== undefined) updatedFields.name = name;
      if (type !== undefined) updatedFields.type = type;
      if (description !== undefined) updatedFields.description = description;
      if (isActive !== undefined) updatedFields.isActive = isActive;
      if (balance !== undefined) updatedFields.balance = balance;
      if (user !== undefined) updatedFields.user = user;
      
      const account = await Account.findByIdAndUpdate(
        id,
        updatedFields,
        { new: true, runValidators: true }
      ).populate('user', 'username email firstName lastName');
      
      if (!account) {
        return next(new NotFoundError('Account not found'));
      }
      
      res.status(200).json({ account });
    } catch (error) {
      next(error);
    }
  }

  async deleteAdmin(req, res, next) {
    try {
      const { id } = req.params;
      
      // Find account without user filter
      const account = await Account.findById(id);
      
      if (!account) {
        return next(new NotFoundError('Account not found'));
      }
      
      // Check if already deleted
      if (account.isDeleted) {
        return next(new BadRequestError('Account is already deleted'));
      }
      
      // Soft delete
      await account.softDelete();
      res.status(200).json({ 
        message: 'Account soft deleted successfully',
        accountId: account._id
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreAdmin(req, res, next) {
    try {
      // Set includeDeleted flag to allow finding deleted items
      const query : any = Account.findById(req.params.id);
      query.includeDeleted = true;
      
      const account = await query;
      if (!account) {
        return next(new NotFoundError('Account not found'));
      }
      
      if (!account.isDeleted) {
        return next(new BadRequestError('Account is not deleted'));
      }
      
      await account.restore();
      res.status(200).json({ 
        message: 'Account restored successfully',
        account
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeleted(req, res, next) {
    try {
      // Find all deleted accounts (not filtered by user)
      const deletedAccounts = await Account.findDeleted();
      
      res.status(200).json({ 
        deletedAccounts,
        count: deletedAccounts.length
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AccountController; 