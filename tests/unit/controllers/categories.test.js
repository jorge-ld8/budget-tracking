const mongoose = require('mongoose');
const CategoriesController = require('../../../src/controllers/categories');
const Category = require('../../../src/models/categories');

// Mock Category model methods
jest.mock('../../../src/models/categories');

describe('Categories Controller', () => {
  let categoriesController;
  let req;
  let res;
  
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
      user: { _id: new mongoose.Types.ObjectId() },
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnValue({
        categories: mockCategories,
        nbHits: mockCategories.length,
        page: 1,
        limit: 10,
        totalPages: 1
      })
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
    const mockCategory = { _id: 'category123', name: 'Food', type: 'expense' };
    req.params.id = 'category123';
    
    Category.findOne.mockResolvedValue(mockCategory);
    
    await categoriesController.getById(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ category: mockCategory });
  });

  // Add tests for create, update, delete, restore, etc.
});
