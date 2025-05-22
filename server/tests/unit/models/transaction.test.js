const Transaction = require('../../../src/models/transactions.ts');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Transaction Model', () => {
  let mongod;

  // Setup before running any tests
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  // Clean up after all tests are done
  afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
  });

  it('should create a transaction successfully', async () => {
    const transactionData = {
      amount: 50.75,
      type: 'expense',
      description: 'Test Transaction',
      date: new Date(),
      category: new mongoose.Types.ObjectId(),
      account: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId()
    };
    
    const transaction = new Transaction(transactionData);
    const savedTransaction = await transaction.save();
    
    expect(savedTransaction._id).toBeDefined();
    expect(savedTransaction.amount).toBe(transactionData.amount);
    expect(savedTransaction.type).toBe(transactionData.type);
    expect(savedTransaction.description).toBe(transactionData.description);
    expect(savedTransaction.category).toEqual(transactionData.category);
    expect(savedTransaction.account).toEqual(transactionData.account);
    expect(savedTransaction.user).toEqual(transactionData.user);
  });

  it('should fail validation without required fields', async () => {
    const transaction = new Transaction({});
    
    let error;
    try {
      await transaction.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.amount).toBeDefined();
    expect(error.errors.type).toBeDefined();
    expect(error.errors.description).toBeDefined();
    expect(error.errors.category).toBeDefined();
    expect(error.errors.account).toBeDefined();
    expect(error.errors.user).toBeDefined();
  });

  it('should validate type enum values', async () => {
    const transaction = new Transaction({
      amount: 50.75,
      type: 'invalid-type', // Invalid enum value
      description: 'Test Transaction',
      category: new mongoose.Types.ObjectId(),
      account: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId()
    });
    
    let error;
    try {
      await transaction.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.type).toBeDefined();
  });

  // it('should use default date when not provided', async () => {
  //   const now = Date.now();
  //   const transactionData = {
  //     amount: 50.75,
  //     type: 'expense',
  //     description: 'Test Default Date',
  //     category: new mongoose.Types.ObjectId(),
  //     account: new mongoose.Types.ObjectId(),
  //     user: new mongoose.Types.ObjectId()
  //   };
    
  //   const transaction = new Transaction(transactionData);
  //   const savedTransaction = await transaction.save();
    
  //   expect(savedTransaction.date).toBeDefined();
  //   expect(savedTransaction.date.getTime()).toBeGreaterThanOrEqual(now - 1000); // Allow 1 second difference
  //   expect(savedTransaction.date.getTime()).toBeLessThanOrEqual(now + 1000);
  // });

  it('should update transaction fields correctly', async () => {
    const transaction = new Transaction({
      amount: 50.75,
      type: 'expense',
      description: 'Original Description',
      category: new mongoose.Types.ObjectId(),
      account: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId()
    });
    await transaction.save();
    
    // Update transaction
    transaction.amount = 75.50;
    transaction.description = 'Updated Description';
    await transaction.save();
    
    expect(transaction.amount).toBe(75.50);
    expect(transaction.description).toBe('Updated Description');
  });
  
  it('should support soft deletion methods', async () => {
    const transaction = await Transaction.create({
      amount: 50.75,
      type: 'expense',
      description: 'Soft Delete Test',
      category: new mongoose.Types.ObjectId(),
      account: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId()
    });
    
    await transaction.softDelete();
    expect(transaction.isDeleted).toBe(true);
    
    // Test that it's excluded from regular queries
    const foundTransaction = await Transaction.findById(transaction._id);
    expect(foundTransaction).toBeNull();
    
    // Test it can be found with includeDeleted
    const query = Transaction.findById(transaction._id);
    query.includeDeleted = true;
    const deletedTransaction = await query;
    expect(deletedTransaction).not.toBeNull();
    expect(deletedTransaction.isDeleted).toBe(true);
  });
  
  it('should support restore method', async () => {
    const transaction = await Transaction.create({
      amount: 50.75,
      type: 'expense',
      description: 'Restore Test',
      category: new mongoose.Types.ObjectId(),
      account: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId()
    });
    
    // Delete and then restore
    await transaction.softDelete();
    expect(transaction.isDeleted).toBe(true);
    
    await transaction.restore();
    expect(transaction.isDeleted).toBe(false);
    
    // Verify it shows up in normal queries again
    const restoredTransaction = await Transaction.findById(transaction._id);
    expect(restoredTransaction).not.toBeNull();
    expect(restoredTransaction.isDeleted).toBe(false);
  });
  
  it('should use findDeleted static method to find deleted documents', async () => {
    // Create and delete a transaction
    const transaction = await Transaction.create({
      amount: 50.75,
      type: 'expense',
      description: 'FindDeleted Test',
      category: new mongoose.Types.ObjectId(),
      account: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId()
    });
    await transaction.softDelete();
    
    // Use findDeleted to find it
    const deletedTransactions = await Transaction.findDeleted({
      _id: transaction._id
    });
    
    expect(deletedTransactions.length).toBeGreaterThan(0);
    expect(deletedTransactions[0]._id.toString()).toBe(transaction._id.toString());
    expect(deletedTransactions[0].isDeleted).toBe(true);
  });
  
  it('should respect isDeleted filter in countDocuments', async () => {
    // Create a unique user ID to isolate this test
    const userId = new mongoose.Types.ObjectId();
    
    // Create 3 transactions, then delete 1
    await Transaction.create({
      amount: 50.75,
      type: 'expense',
      description: 'Count Test 1',
      category: new mongoose.Types.ObjectId(),
      account: new mongoose.Types.ObjectId(),
      user: userId
    });
    
    await Transaction.create({
      amount: 75.25,
      type: 'expense',
      description: 'Count Test 2',
      category: new mongoose.Types.ObjectId(),
      account: new mongoose.Types.ObjectId(),
      user: userId
    });
    
    const transaction3 = await Transaction.create({
      amount: 100,
      type: 'expense',
      description: 'Count Test 3',
      category: new mongoose.Types.ObjectId(),
      account: new mongoose.Types.ObjectId(),
      user: userId
    });
    await transaction3.softDelete();
    
    // Count active documents
    const activeCount = await Transaction.countDocuments({ user: userId });
    expect(activeCount).toBe(2);
    
    // Count all documents including deleted
    const totalCount = await Transaction.countDocuments(
      { user: userId },
      { includeDeleted: true }
    );
    expect(totalCount).toBe(3);
  });
});