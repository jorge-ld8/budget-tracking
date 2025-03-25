const Account = require('../models/accounts');
const { NotFoundError, BadRequestError } = require('../errors');
const BaseController = require('../interfaces/BaseController');

class AccountController extends BaseController {
  constructor() {
    super();
  }

  async getAll(req, res) {
    const { type, name, sort, fields, page, limit, numericFilters } = req.query;

    const queryObject = {};
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
    const account = await Account.findById(id);
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
    
    // Otherwise do soft delete
    const account = await Account.findById(id);
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
    const account = await Account.findByIdAndUpdate(
      id, 
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

    const account = await Account.findById(id);
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
    const account = await Account.findById(id);
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
    const { userId } = req.params;
    
    let query;
    query = Account.find({ user: userId });
    
    const accounts = await query;
    res.status(200).json({ accounts });
  }

  async restore(req, res, next) {
    // Set includeDeleted flag to allow finding deleted items
    const query = Account.findById(req.params.id);
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
    const deletedAccounts = await Account.findDeleted();
    res.status(200).json({ 
      deletedAccounts,
      count: deletedAccounts.length
    });
  }
}

module.exports = AccountController; 