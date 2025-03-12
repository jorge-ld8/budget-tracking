const User = require('../models/users');
const asyncWrapper = require('../middlewares/async-wrapper');
const { createCustomError } = require('../errors/custom-error');

const getAllUsers = asyncWrapper(async (req, res) => {
    const users = await User.find();
    res.status(200).json({ users });
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
    const { username, email, password, firstName, lastName } = req.body;

    // Create a new user
    const user = new User({ username, email, password, firstName, lastName });
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