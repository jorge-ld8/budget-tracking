const User = require('../models/users');
const { createCustomError } = require('../errors/custom-error');
const BaseController = require('../interfaces/BaseController');

class UsersController extends BaseController {
  constructor() {
    super();
  }

  async getAll(req, res) {
    const { currency, name, sort, fields, page, limit, numericFilters } = req.query;

    const queryObject = {};
    if (currency) {
      queryObject.currency = currency;
    }
    if (name) {
      queryObject.$or = [
        { username: { $regex: name, $options: 'i' } },
        { email: { $regex: name, $options: 'i' } },
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } }
      ];
    }
    if (numericFilters) {
      console.log(numericFilters);
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
      const options = ['balance', 'age'];
      filters = filters.split(',').forEach((item) => {
        const [field, operator, value] = item.split('-');
        if (options.includes(field)) {
          queryObject[field] = { [operator]: Number(value) };
        }
      });
    }
    let result = User.find(queryObject);

    if (sort) {
      const sortFields = sort.split(',').join(' ');
      result = result.sort(sortFields);
    }
    if (fields) {
      const fieldsList = fields.split(',').join(' ');
      result = result.select(fieldsList);
    }
    
    // Pagination
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;
    
    result = result.skip(skip).limit(limitNumber);
    
    const users = await result;
    res.status(200).json({ 
      users, 
      nbHits: users.length,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(await User.countDocuments(queryObject) / limitNumber)
    });
  }

  async getById(req, res, next) {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      const error = createCustomError('User not found', 404);
      return next(error);
    }
    res.status(200).json({ user });
  }

  async create(req, res) {
    const user = new User({...req.body});
    await user.save();

    // Send a success response
    res.status(201).json({ user });
  }

  async delete(req, res, next) {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      const error = createCustomError('User not found', 404);
      return next(error);
    }
    
    if (user.isDeleted) {
      return res.status(400).json({ message: 'User is already deleted' });
    }
    
    await user.softDelete();
    res.status(200).json({ message: 'User soft deleted successfully' });
  }

  async update(req, res, next) {
    const { id } = req.params;
    const { username, email, password, firstName, lastName } = req.body;
    const user = await User.findByIdAndUpdate(id, { username, email, password, firstName, lastName }, 
      { new: true , runValidators: true });
    if (!user) {
      const error = createCustomError('User not found', 404);
      return next(error);
    }
    res.status(200).json({ user });
  }
  
  async restore(req, res, next) {
    // Set includeDeleted flag to allow finding deleted items
    const query = User.findById(req.params.id);
    query.includeDeleted = true;
    
    const user = await query;
    if (!user) {
      const error = createCustomError('User not found', 404);
      return next(error);
    }
    
    if (!user.isDeleted) {
      return res.status(400).json({ message: 'User is not deleted' });
    }
    
    await user.restore();
    res.status(200).json({ message: 'User restored successfully', user });
  }

  async getDeletedUsers(req, res) {
    const deletedUsers = await User.findDeleted();
    res.status(200).json({ 
      deletedUsers,
      count: deletedUsers.length
    });
  }
}

module.exports = UsersController;