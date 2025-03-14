const User = require('../models/users');
const asyncWrapper = require('../middlewares/async-wrapper');
const { createCustomError } = require('../errors/custom-error');

const getAllUsers = asyncWrapper(async (req, res) => {
    const { currency , name, sort} = req.query;

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
    let result = User.find(queryObject);
    
    if (sort) {
      const sortFields = sort.split(',').join(' ');
      result = result.sort(sortFields);
    }
    const users = await result;
    res.status(200).json({ users, nbHits: users.length });
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