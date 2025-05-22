// tests/models/user.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../../src/models/users.ts');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

jest.mock('jsonwebtoken');
jest.mock('bcrypt')

describe('User Model', () => {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await User.deleteMany();

    // Mock hash function to return a predictable value
    bcrypt.hash.mockResolvedValue('hashed_password');
    
    // Mock compare function to return true when password matches 'Password123!'
    bcrypt.compare.mockImplementation((candidatePassword) => {
      return Promise.resolve(candidatePassword === 'Password123!');
    });
  });

  it('should create a user successfully', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      currency: 'USD'
    };
    
    const user = new User(userData);
    const savedUser = await user.save();
    
    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.email).toBe(userData.email);
    // Password should be hashed
    expect(savedUser.password).not.toBe(userData.password);
  });

  it('should fail validation without required fields', async () => {
    const user = new User({});
    
    let error;
    try {
      await user.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.username).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  it('should fail validation with invalid email', async () => {
    const user = new User({
      username: 'testuser',
      email: 'invalid-email',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      currency: 'USD'
    });

    let error;
    try {
      await user.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });

  it('should fail validation with invalid currency', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      currency: 'invalid-currency'
    });

    let error;
    try {
      await user.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.currency).toBeDefined();
  });
  
  it('should support soft deletion methods', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      currency: 'USD'
    });
    
    await user.softDelete();
    expect(user.isDeleted).toBe(true);
    
    // Test that it's excluded from regular queries
    const foundUser = await User.findById(user._id);
    expect(foundUser).toBeNull();
    
    // Test it can be found with includeDeleted
    const query = User.findById(user._id);
    query.includeDeleted = true;
    const deletedUser = await query;
    expect(deletedUser).not.toBeNull();
    expect(deletedUser.isDeleted).toBe(true);
  });
  
  it('should support restore method', async () => {
    const user = await User.create({
      username: 'restoreuser',
      email: 'restore@example.com',
      password: 'Password123!',
      firstName: 'Restore',
      lastName: 'User',
      currency: 'USD'
    });
    
    // Delete and then restore
    await user.softDelete();
    expect(user.isDeleted).toBe(true);
    
    await user.restore();
    expect(user.isDeleted).toBe(false);
    
    // Verify it shows up in normal queries again
    const restoredUser = await User.findById(user._id);
    expect(restoredUser).not.toBeNull();
    expect(restoredUser.isDeleted).toBe(false);
  });
  
  it('should use findDeleted static method to find deleted documents', async () => {
    // Create and delete a user
    const user = await User.create({
      username: 'deleteduser',
      email: 'deleted@example.com',
      password: 'Password123!',
      firstName: 'Deleted',
      lastName: 'User',
      currency: 'USD'
    });
    await user.softDelete();
    
    // Use findDeleted to find it
    const deletedUsers = await User.findDeleted({
      _id: user._id
    });
    
    expect(deletedUsers.length).toBeGreaterThan(0);
    expect(deletedUsers[0]._id.toString()).toBe(user._id.toString());
    expect(deletedUsers[0].isDeleted).toBe(true);
  });
  
  it('should respect isDeleted filter in countDocuments', async () => {
    // Create a unique identifier for this test
    const uniquePrefix = 'counttest_';
    
    // Create 3 users, then delete 1
    await User.create({
      username: uniquePrefix + 'user1',
      email: uniquePrefix + 'user1@example.com',
      password: 'Password123!',
      firstName: 'Count',
      lastName: 'User1',
      currency: 'USD'
    });
    
    await User.create({
      username: uniquePrefix + 'user2',
      email: uniquePrefix + 'user2@example.com',
      password: 'Password123!',
      firstName: 'Count',
      lastName: 'User2',
      currency: 'USD'
    });
    
    const user3 = await User.create({
      username: uniquePrefix + 'user3',
      email: uniquePrefix + 'user3@example.com',
      password: 'Password123!',
      firstName: 'Count',
      lastName: 'User3',
      currency: 'USD'
    });
    await user3.softDelete();
    
    // Count active documents
    const activeCount = await User.countDocuments({ 
      username: { $regex: `^${uniquePrefix}` }
    });
    expect(activeCount).toBe(2);
    
    // Count all documents including deleted
    const totalCount = await User.countDocuments(
      { username: { $regex: `^${uniquePrefix}` } },
      { includeDeleted: true }
    );
    expect(totalCount).toBe(3);
  });

  it('should compare passwords correctly', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      currency: 'USD'
    });
    
    const isMatch = await user.comparePassword('Password123!');
    expect(isMatch).toBe(true);

    const isMatch2 = await user.comparePassword('WrongPassword');
    expect(isMatch2).toBe(false);
  });

  it('should generate a JWT Auth token', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      currency: 'USD'
    });

    // Mock the JWT verify method
    jwt.verify.mockReturnValue({ id: user._id });
    jwt.sign.mockReturnValue('mocked_token');

    const token = user.generateAuthToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(user._id);
  });
});