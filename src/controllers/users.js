const User = require('../models/users');
const asyncWrapper = require('../middlewares/async-wrapper');
const { createCustomError } = require('../errors/custom-error');

const getAllUsers = asyncWrapper(async (req, res) => {
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
});


const getUserById = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        const error = createCustomError('User not found', 404);
        return next(error);
    }
    res.status(200).json({ user });
});

const createUser = asyncWrapper(async (req, res) => {
    const user = new User({...req.body});
    await user.save();

    // Send a success response
    res.status(201).json({ user });
});


const deleteUser = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
        const error = createCustomError('User not found', 404);
        return next(error);
    }
    res.status(200).json({ message: 'User deleted successfully' });
});

const updateUser = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { username, email, password, firstName, lastName } = req.body;
    const user = await User.findByIdAndUpdate(id, { username, email, password, firstName, lastName }, 
        { new: true , runValidators: true });
    if (!user) {
        const error = createCustomError('User not found', 404);
        return next(error);
    }
    res.status(200).json({ user });
});

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
  deleteUser,
};