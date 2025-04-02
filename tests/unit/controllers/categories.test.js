const mongoose = require('mongoose');
const CategoriesController = require('../../../src/controllers/categories');
const Category = require('../../../src/models/categories');
const { NotFoundError, BadRequestError } = require('../../../src/errors');

// Mock Category model methods
jest.mock('../../../src/models/categories');

describe('Categories Controller', () => {
  let categoriesController;
  let req;
  let res;
  let mockUserId;
  let mockCategories;
  
  beforeEach(() => {
    categoriesController = new CategoriesController();
    mockUserId = new mongoose.Types.ObjectId();

    // Create 3 mock categories for testing
    mockCategories = [
      { 
        _id: new mongoose.Types.ObjectId(),
        name: 'Groceries', 
        type: 'expense',
        icon: 'grocery-cart',
        color: '#4CAF50',
        user: mockUserId,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        isDeleted: false
      },
      { 
        _id: new mongoose.Types.ObjectId(),
        name: 'Salary', 
        type: 'income',
        icon: 'money',
        color: '#2196F3',
        user: mockUserId,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
        isDeleted: false
      },
      { 
        _id: new mongoose.Types.ObjectId(),
        name: 'Entertainment', 
        type: 'expense',
        icon: 'movie',
        color: '#FF5722',
        user: mockUserId,
        createdAt: new Date('2023-01-03'),
        updatedAt: new Date('2023-01-03'),
        isDeleted: false
      }
    ];

    req = {
      user: { _id: mockUserId },
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test getAll method
  it('should get all categories for a user', async () => {
    Category.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockCategories)
    });
    
    Category.countDocuments.mockResolvedValue(mockCategories.length);
    
    await categoriesController.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      categories: mockCategories,
      nbHits: mockCategories.length,
      page: 1,
      limit: 10,
      totalPages: 1
    });
  });

  // Test getById method
  it('should get a category by ID', async () => {
    const mockCategory = mockCategories[0];
    req.params.id = mockCategory._id;
    
    Category.findOne.mockResolvedValue(mockCategory);
    
    await categoriesController.getById(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ category: mockCategory });
  });

  // Test create method
  describe('create method', () => {
    it('should create a new category', async () => {
      const newCategoryData = {
        name: 'New Category',
        type: 'expense',
        icon: 'new-icon',
        color: '#000000'
      };
      req.body = newCategoryData;

      const savedCategory = {
        ...newCategoryData,
        _id: new mongoose.Types.ObjectId(),
        user: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockCategoryInstance = {
        ...savedCategory,
        save: jest.fn().mockResolvedValue(savedCategory)
      }

      Category.mockImplementation(() => mockCategoryInstance);

      await categoriesController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({...mockCategoryInstance});
    });

  //   it('should handle validation errors', async () => {
  //     const invalidCategoryData = {
  //       name: '', // Empty name should trigger validation error
  //       type: 'invalid-type' // Invalid type should trigger validation error
  //     };
  //     req.body = invalidCategoryData;

  //     const validationError = new Error('Validation failed');
  //     validationError.name = 'ValidationError';
  //     Category.prototype.save = jest.fn().mockRejectedValue(validationError);

  //     await categoriesController.create(req, res);

  //     expect(res.status).toHaveBeenCalledWith(400);
  //     expect(res.json).toHaveBeenCalledWith({
  //       error: 'Validation failed'
  //     });
  //   });
  });

  // Test update method
  describe('update method', () => {
    it('should update an existing category', async () => {
      const categoryId = mockCategories[0]._id;
      const updateData = {
        name: 'Updated Category',
        type: 'income',
        icon: 'updated-icon',
        color: '#FFFFFF'
      };
      req.params.id = categoryId;
      req.body = updateData;

      const updatedCategory = {
        ...mockCategories[0],
        ...updateData,
        updatedAt: new Date()
      };

      Category.findOneAndUpdate.mockResolvedValue(updatedCategory);

      await categoriesController.update(req, res);

      expect(Category.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: categoryId, user: mockUserId },
        updateData,
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ category: updatedCategory });
    });

    it('should return 404 if category not found', async () => {
      req.params.id = new mongoose.Types.ObjectId();
      req.body = { name: 'Updated Name' };

      Category.findOneAndUpdate.mockResolvedValue(null);

      const next = jest.fn();
      await categoriesController.update(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  // Test delete method
  describe('delete method', () => {
    it('should soft delete a category', async () => {
      const categoryId = mockCategories[0]._id;
      req.params.id = categoryId;

      const category = { ...mockCategories[0], softDelete: jest.fn() };
      Category.findOne.mockResolvedValue(category);

      await categoriesController.delete(req, res);

      expect(Category.findOne).toHaveBeenCalledWith({
        _id: categoryId,
        user: mockUserId
      });
      expect(category.softDelete).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category soft deleted successfully'
      });
    });

    it('should return 404 if category not found', async () => {
      req.params.id = new mongoose.Types.ObjectId();
      Category.findOne.mockResolvedValue(null);

      const next = jest.fn();
      await categoriesController.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('should return 400 if category is already deleted', async () => {
      const categoryId = mockCategories[0]._id;
      req.params.id = categoryId;

      const deletedCategory = {
        ...mockCategories[0],
        isDeleted: true
      };
      Category.findOne.mockResolvedValue(deletedCategory);

      const next = jest.fn();
      await categoriesController.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  // Test restore method
  describe('restore method', () => {
    it('should restore a deleted category', async () => {
      const categoryId = mockCategories[0]._id;
      req.params.id = categoryId;

      const deletedCategory = {
        ...mockCategories[0],
        isDeleted: true,
        restore: jest.fn()
      };

      const query = {
        includeDeleted: true,
        then: jest.fn((resolve) => resolve(deletedCategory))
      };
      Category.findOne.mockReturnValue(query);

      await categoriesController.restore(req, res);

      expect(query.includeDeleted).toBe(true);
      expect(deletedCategory.restore).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category restored successfully',
        category: deletedCategory
      });
    });

    it('should return 404 if category not found', async () => {
      req.params.id = new mongoose.Types.ObjectId();
      const query = {
        includeDeleted: true,
        then: jest.fn((resolve) => resolve(null))
      }
      Category.findOne.mockReturnValue(query);

      const next = jest.fn();
      await categoriesController.restore(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('should return 400 if category is not deleted', async () => {
      const categoryId = mockCategories[0]._id;
      req.params.id = categoryId;

      const activeCategory = {
        ...mockCategories[0],
        isDeleted: false
      };

      const query = {
        includeDeleted: true,
        then: jest.fn((resolve) => resolve(activeCategory))
      };

      Category.findOne.mockReturnValue(query);

      const next = jest.fn();
      await categoriesController.restore(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  // Test getDeletedCategories method
  describe('getDeletedCategories method', () => {
    it('should get all deleted categories for a user', async () => {
      const deletedCategories = mockCategories.map(cat => ({
        ...cat,
        isDeleted: true
      }));

      Category.findDeleted.mockResolvedValue(deletedCategories);

      await categoriesController.getDeletedCategories(req, res);

      expect(Category.findDeleted).toHaveBeenCalledWith({
        user: mockUserId
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        deletedCategories,
        count: deletedCategories.length
      });
    });

    it('should return empty array if no deleted categories exist', async () => {
      Category.findDeleted.mockResolvedValue([]);

      await categoriesController.getDeletedCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        deletedCategories: [],
        count: 0
      });
    });
  });
});
