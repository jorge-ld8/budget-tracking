const Budget = require('../../../src/models/budgets');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Budget Model', () => {
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

  it('should create a budget successfully', async () => {
    const budgetData = {
      amount: 500,
      period: 'monthly',
      category: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      user: new mongoose.Types.ObjectId()
    };
    
    const budget = new Budget(budgetData);
    const savedBudget = await budget.save();
    
    expect(savedBudget._id).toBeDefined();
    expect(savedBudget.amount).toBe(budgetData.amount);
    expect(savedBudget.period).toBe(budgetData.period);
    expect(savedBudget.category).toEqual(budgetData.category);
    expect(savedBudget.startDate).toEqual(budgetData.startDate);
    expect(savedBudget.user).toEqual(budgetData.user);
    expect(savedBudget.isRecurring).toBe(true); // Default value
  });

  it('should fail validation without required fields', async () => {
    const budget = new Budget({});
    
    let error;
    try {
      await budget.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.amount).toBeDefined();
    expect(error.errors.period).toBeDefined();
    expect(error.errors.category).toBeDefined();
    expect(error.errors.startDate).toBeDefined();
    expect(error.errors.user).toBeDefined();
  });

  it('should validate period enum values', async () => {
    const budget = new Budget({
      amount: 500,
      period: 'invalid-period', // Invalid enum value
      category: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      user: new mongoose.Types.ObjectId()
    });
    
    let error;
    try {
      await budget.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.period).toBeDefined();
  });

  it('should update budget fields correctly', async () => {
    const budget = new Budget({
      amount: 500,
      period: 'monthly',
      category: new mongoose.Types.ObjectId(),
      startDate: new Date(),
      user: new mongoose.Types.ObjectId()
    });
    await budget.save();
    
    // Update budget
    budget.amount = 700;
    budget.period = 'yearly';
    budget.isRecurring = false;
    await budget.save();
    
    expect(budget.amount).toBe(700);
    expect(budget.period).toBe('yearly');
    expect(budget.isRecurring).toBe(false);
  });
  
//   it('should support soft deletion methods', async () => {
//     const budget = await Budget.create({
//       amount: 500,
//       period: 'monthly',
//       category: new mongoose.Types.ObjectId(),
//       startDate: new Date(),
//       user: new mongoose.Types.ObjectId()
//     });
    
//     await budget.softDelete();
//     expect(budget.isDeleted).toBe(true);
    
//     // Test that it's excluded from regular queries
//     const foundBudget = await Budget.findById(budget._id);
//     expect(foundBudget).toBeNull();
    
//     // Test it can be found with includeDeleted
//     const query = Budget.findById(budget._id);
//     query.includeDeleted = true;
//     const deletedBudget = await query;
//     expect(deletedBudget).not.toBeNull();
//     expect(deletedBudget.isDeleted).toBe(true);
//   });
  
//   it('should support restore method', async () => {
//     const budget = await Budget.create({
//       amount: 500,
//       period: 'monthly',
//       category: new mongoose.Types.ObjectId(),
//       startDate: new Date(),
//       user: new mongoose.Types.ObjectId()
//     });
    
//     // Delete and then restore
//     await budget.softDelete();
//     expect(budget.isDeleted).toBe(true);
    
//     await budget.restore();
//     expect(budget.isDeleted).toBe(false);
    
//     // Verify it shows up in normal queries again
//     const restoredBudget = await Budget.findById(budget._id);
//     expect(restoredBudget).not.toBeNull();
//     expect(restoredBudget.isDeleted).toBe(false);
//   });
  
//   it('should use findDeleted static method to find deleted documents', async () => {
//     // Create and delete a budget
//     const budget = await Budget.create({
//       amount: 500,
//       period: 'monthly',
//       category: new mongoose.Types.ObjectId(),
//       startDate: new Date(),
//       user: new mongoose.Types.ObjectId()
//     });
//     await budget.softDelete();
    
//     // Use findDeleted to find it
//     const deletedBudgets = await Budget.findDeleted({
//       _id: budget._id
//     });
    
//     expect(deletedBudgets.length).toBeGreaterThan(0);
//     expect(deletedBudgets[0]._id.toString()).toBe(budget._id.toString());
//     expect(deletedBudgets[0].isDeleted).toBe(true);
//   });
  
//   it('should respect isDeleted filter in countDocuments', async () => {
//     // Create a unique user ID to isolate this test
//     const userId = new mongoose.Types.ObjectId();
    
//     // Create 3 budgets, then delete 1
//     await Budget.create({
//       amount: 500,
//       period: 'monthly',
//       category: new mongoose.Types.ObjectId(),
//       startDate: new Date(),
//       user: userId
//     });
    
//     await Budget.create({
//       amount: 700,
//       period: 'yearly',
//       category: new mongoose.Types.ObjectId(),
//       startDate: new Date(),
//       user: userId
//     });
    
//     const budget3 = await Budget.create({
//       amount: 300,
//       period: 'weekly',
//       category: new mongoose.Types.ObjectId(),
//       startDate: new Date(),
//       user: userId
//     });
//     await budget3.softDelete();
    
//     // Count active documents
//     const activeCount = await Budget.countDocuments({ user: userId });
//     expect(activeCount).toBe(2);
    
//     // Count all documents including deleted
//     const totalCount = await Budget.countDocuments(
//       { user: userId },
//       { includeDeleted: true }
//     );
//     expect(totalCount).toBe(3);
//   });
}); 