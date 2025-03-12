const User = require('../models/users');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Failed to get all users', error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error getting user by id:', error);
    res.status(500).json({ message: 'Failed to get user by id', error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Create a new user
    const user = new User({ username, email, password, firstName, lastName });
    await user.save();

    // Send a success response
    res.status(201).json({ user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
}; 


const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, firstName, lastName } = req.body;
    const user = await User.findByIdAndUpdate(id, { username, email, password, firstName, lastName }, 
        { new: true , runValidators: true });
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
  deleteUser,
};