const Account = require('../../../src/models/accounts');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Account Model', () => {
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


  it('should create an account successfully', async () => {
    const accountData = {
      name: 'Test Account',
      type: 'bank',
      user: new mongoose.Types.ObjectId(),
      balance: 100
    };
    
    const account = new Account(accountData);
    const savedAccount = await account.save();
    
    expect(savedAccount._id).toBeDefined();
    expect(savedAccount.name).toBe(accountData.name);
    expect(savedAccount.type).toBe(accountData.type);
    expect(savedAccount.user).toBe(accountData.user);
    expect(savedAccount.balance).toBe(accountData.balance);
  });

  it('should fail validation without required fields', async () => {
    const account = new Account({});
    
    let error;
    try {
      await account.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.user).toBeDefined();
});

  it('should update balance correctly', async () => {
    const account = new Account({
      name: 'Test Account',
      type: 'bank',
      user: new mongoose.Types.ObjectId(),
      balance: 100
    });
    await account.save();
    
    // Test balance operations
    account.balance += 50;
    await account.save();
    expect(account.balance).toBe(150);
  });
  
  it('should support soft deletion', async () => {
    const account = await Account.create({
      name: 'Deletion Test',
      type: 'cash',
      user: new mongoose.Types.ObjectId()
    });
    
    await account.softDelete();
    expect(account.isDeleted).toBe(true);
    
    // Test that it's excluded from regular queries
    const foundAccount = await Account.findById(account._id);
    expect(foundAccount).toBeNull();
    
    // Test it can be found with includeDeleted
    const query = Account.findById(account._id);
    query.includeDeleted = true;
    const deletedAccount = await query;
    expect(deletedAccount).not.toBeNull();
    expect(deletedAccount.isDeleted).toBe(true);
  });
});
