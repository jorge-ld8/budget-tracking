const Category = require('../../../src/models/categories');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Category Model', () => {
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

  afterEach(async () => {
    await Category.deleteMany();
  });

  it('should create a category successfully', async () => {
    const categoryData = {
      name: 'Test Category',
      type: 'expense',
      icon: 'test-icon',
      color: '#FF5733',
      user: new mongoose.Types.ObjectId()
    };
    
    const category = new Category(categoryData);
    const savedCategory = await category.save();
    
    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe(categoryData.name);
    expect(savedCategory.type).toBe(categoryData.type);
    expect(savedCategory.icon).toBe(categoryData.icon);
    expect(savedCategory.color).toBe(categoryData.color);
    expect(savedCategory.user).toEqual(categoryData.user);
  });

  it('should fail validation without required fields', async () => {
    const category = new Category({});
    
    let error;
    try {
      await category.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.type).toBeDefined();
    expect(error.errors.user).toBeDefined();
  });

  it('should validate type enum values', async () => {
    const category = new Category({
      name: 'Test Category',
      type: 'invalid-type', // Invalid enum value
      user: new mongoose.Types.ObjectId()
    });
    
    let error;
    try {
      await category.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.type).toBeDefined();
  });

  it('should use default values when not provided', async () => {
    const categoryData = {
      name: 'Test Default Values',
      type: 'income',
      user: new mongoose.Types.ObjectId()
    };
    
    const category = new Category(categoryData);
    const savedCategory = await category.save();
    
    expect(savedCategory.icon).toBe('default-icon'); // Default value
    expect(savedCategory.color).toBe('#000000'); // Default value
  });

  it('should update category fields correctly', async () => {
    // Create initial category
    const category = await Category.create({
      name: 'Test Category',
      type: 'expense',
      user: new mongoose.Types.ObjectId()
    });
    
    // Update using Model.findByIdAndUpdate
    const updatedCategory = await Category.findByIdAndUpdate(
      category._id,
      { 
        name: 'Updated Category',
        color: '#00FF00' 
      },
      { new: true, runValidators: true }
    );
    
    // Verify update returned correct values
    expect(updatedCategory.name).toBe('Updated Category');
    expect(updatedCategory.color).toBe('#00FF00');
    
    // Verify by retrieving from DB again
    const retrievedCategory = await Category.findById(category._id);
    expect(retrievedCategory.name).toBe('Updated Category');
    expect(retrievedCategory.color).toBe('#00FF00');
  });
  
  it('should support soft deletion methods', async () => {
    const category = await Category.create({
      name: 'Deletion Test',
      type: 'expense',
      user: new mongoose.Types.ObjectId()
    });
    
    await category.softDelete();
    expect(category.isDeleted).toBe(true);
    
    // Test that it's excluded from regular queries
    const foundCategory = await Category.findById(category._id);
    expect(foundCategory).toBeNull();
    
    // Test it can be found with includeDeleted
    const query = Category.findById(category._id);
    query.includeDeleted = true;
    const deletedCategory = await query;
    expect(deletedCategory).not.toBeNull();
    expect(deletedCategory.isDeleted).toBe(true);
  });
  
  it('should support restore method', async () => {
    const category = await Category.create({
      name: 'Restore Test',
      type: 'expense',
      user: new mongoose.Types.ObjectId()
    });
    
    // Delete and then restore
    await category.softDelete();
    expect(category.isDeleted).toBe(true);
    
    await category.restore();
    expect(category.isDeleted).toBe(false);
    
    // Verify it shows up in normal queries again
    const restoredCategory = await Category.findById(category._id);
    expect(restoredCategory).not.toBeNull();
    expect(restoredCategory.isDeleted).toBe(false);
  });
  
  it('should use findDeleted static method to find deleted documents', async () => {
    // Create and delete a category
    const category = await Category.create({
      name: 'FindDeleted Test',
      type: 'expense',
      user: new mongoose.Types.ObjectId()
    });
    await category.softDelete();
    
    // Use findDeleted to find it
    const deletedCategories = await Category.findDeleted({
      _id: category._id
    });
    
    expect(deletedCategories.length).toBeGreaterThan(0);
    expect(deletedCategories[0]._id.toString()).toBe(category._id.toString());
    expect(deletedCategories[0].isDeleted).toBe(true);
  });
  
  it('should respect isDeleted filter in countDocuments', async () => {
    // Create a unique user ID to isolate this test
    const userId = new mongoose.Types.ObjectId();
    
    // Create 3 categories, then delete 1
    await Category.create({
      name: 'Count Test 1',
      type: 'income',
      user: userId
    });
    
    await Category.create({
      name: 'Count Test 2',
      type: 'expense',
      user: userId
    });
    
    const category3 = await Category.create({
      name: 'Count Test 3',
      type: 'income',
      user: userId
    });
    await category3.softDelete();
    
    // Count active documents
    const activeCount = await Category.countDocuments({ user: userId });
    expect(activeCount).toBe(2);
    
    // Count all documents including deleted
    const totalCount = await Category.countDocuments(
      { user: userId },
      { includeDeleted: true }
    );
    expect(totalCount).toBe(3);
  });
}); 