import Account from '../../../src/models/accounts.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { IAccountSchema } from '../../../src/types/models/accounts.types.js';

describe('Account Model', () => {
  let mongod: MongoMemoryServer;

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

  afterEach(async () => {
    await Account.deleteMany({});
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
    expect(savedAccount.user).toEqual(accountData.user);
    expect(savedAccount.balance).toBe(accountData.balance);
  });

  it('should fail validation without required fields', async () => {
    const account = new Account({});
    
    let error: any;
    try {
      await account.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.user).toBeDefined();
  });

  it('should update account fields correctly', async () => {
    // Create initial account
    const userId = new mongoose.Types.ObjectId();
    const account = await Account.create({
      name: 'Test Account',
      type: 'bank',
      user: userId,
      balance: 100
    });
    
    // Update using Model.findByIdAndUpdate
    const updatedAccount = await Account.findByIdAndUpdate(
      account._id,
      { 
        name: 'Updated Account',
        type: 'credit',
        balance: 250
      },
      { new: true, runValidators: true }
    );
    
    // Verify update returned correct values
    expect(updatedAccount?.name).toBe('Updated Account');
    expect(updatedAccount?.type).toBe('credit');
    expect(updatedAccount?.balance).toBe(250);
    
    // Verify by retrieving from DB again
    const retrievedAccount = await Account.findById(account._id);
    expect(retrievedAccount?.name).toBe('Updated Account');
    expect(retrievedAccount?.type).toBe('credit');
    expect(retrievedAccount?.balance).toBe(250);
    expect(retrievedAccount?.user.toString()).toBe(userId.toString());
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
    const query: any = Account.findById(account._id);
    query.includeDeleted = true;
    const deletedAccount = await query;
    expect(deletedAccount).not.toBeNull();
    expect(deletedAccount?.isDeleted).toBe(true);
  });
}); 