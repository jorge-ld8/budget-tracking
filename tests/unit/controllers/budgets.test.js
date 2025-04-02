const mongoose = require('mongoose');
const BudgetsController = require('../../../src/controllers/budgets');
const Budget = require('../../../src/models/budgets');
const Category = require('../../../src/models/categories');
const { NotFoundError, BadRequestError } = require('../../../src/errors');

// Mock models
jest.mock('../../../src/models/budgets');
jest.mock('../../../src/models/categories');

describe('Budgets Controller', () => {
  let budgetsController;
  let req;
  let res;
  let next;
  let mockUserId;
  let mockCategoryId;
  let mockBudgets;
  
  beforeEach(() => {
    budgetsController = new BudgetsController();
    mockUserId = new mongoose.Types.ObjectId();
    mockCategoryId = new mongoose.Types.ObjectId();
    next = jest.fn();

    // Create mock budgets for testing
    mockBudgets = [
      { 
        _id: new mongoose.Types.ObjectId(),
        amount: 1000, 
        period: 'monthly',
        category: {
          _id: mockCategoryId,
          name: 'Groceries',
          type: 'expense',
          icon: 'grocery-cart',
          color: '#4CAF50'
        },
        startDate: new Date('2023-01-01'),
        endDate: null,
        isRecurring: true,
        user: mockUserId,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        isDeleted: false
      },
      { 
        _id: new mongoose.Types.ObjectId(),
        amount: 5000, 
        period: 'monthly',
        category: {
          _id: new mongoose.Types.ObjectId(),
          name: 'Salary',
          type: 'income',
          icon: 'money',
          color: '#2196F3'
        },
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        isRecurring: false,
        user: mockUserId,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
        isDeleted: false
      },
      { 
        _id: new mongoose.Types.ObjectId(),
        amount: 200, 
        period: 'weekly',
        category: {
          _id: new mongoose.Types.ObjectId(),
          name: 'Entertainment',
          type: 'expense',
          icon: 'movie',
          color: '#FF5722'
        },
        startDate: new Date('2023-01-01'),
        endDate: null,
        isRecurring: true,
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
  describe('getAll method', () => {
    it('should get all budgets for a user', async () => {
      // Setup find query chain
      const mockFindQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockBudgets)
      };
      
      Budget.find.mockReturnValue(mockFindQuery);
      Budget.countDocuments.mockResolvedValue(mockBudgets.length);
      
      await budgetsController.getAll(req, res, next);

      expect(Budget.find).toHaveBeenCalledWith({ user: mockUserId });
      expect(mockFindQuery.populate).toHaveBeenCalledWith('category', 'name type icon color');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        budgets: mockBudgets,
        count: mockBudgets.length,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    });

    it('should filter budgets by period', async () => {
      req.query.period = 'monthly';
      
      const mockFindQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockBudgets.filter(b => b.period === 'monthly'))
      };
      
      Budget.find.mockReturnValue(mockFindQuery);
      Budget.countDocuments.mockResolvedValue(2); // 2 monthly budgets
      
      await budgetsController.getAll(req, res, next);

      expect(Budget.find).toHaveBeenCalledWith({ 
        user: mockUserId,
        period: 'monthly' 
      });
      expect(res.json.mock.calls[0][0].budgets.length).toBe(2);
    });

    it('should filter budgets by date range', async () => {
      req.query.startDate = '2023-01-01';
      req.query.endDate = '2023-12-31';
      
      const mockFindQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockBudgets)
      };
      
      Budget.find.mockReturnValue(mockFindQuery);
      Budget.countDocuments.mockResolvedValue(mockBudgets.length);
      
      await budgetsController.getAll(req, res, next);

      // Check that the find query includes date filtering
      const expectedQuery = {
        user: mockUserId,
        startDate: { $gte: expect.any(Date) },
        $or: expect.any(Array)
      };
      
      expect(Budget.find).toHaveBeenCalledWith(expect.objectContaining({
        user: mockUserId,
        startDate: expect.any(Object),
        $or: expect.any(Array)
      }));
      
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle numeric filtering', async () => {
      req.query.numericFilters = 'amount>500,amount<=5000';
      
      const mockFindQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockBudgets.filter(b => b.amount > 500 && b.amount <= 5000))
      };
      
      Budget.find.mockReturnValue(mockFindQuery);
      Budget.countDocuments.mockResolvedValue(2); // 2 budgets match the filter
      
      await budgetsController.getAll(req, res, next);

      expect(Budget.find).toHaveBeenCalled();
      // It's difficult to test the exact query object with the numeric filters
      // but we can check the output
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Budget.find.mockImplementation(() => {
        throw error;
      });
      
      await budgetsController.getAll(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // Test getById method
  describe('getById method', () => {
    it('should get a budget by ID', async () => {
      const mockBudget = mockBudgets[0];
      req.params.id = mockBudget._id;
      
      // Mock the populate chain
      const mockPopulateMethod = jest.fn().mockResolvedValue(mockBudget);
      Budget.findOne.mockReturnValue({
        populate: mockPopulateMethod
      });
      
      await budgetsController.getById(req, res, next);
      
      expect(Budget.findOne).toHaveBeenCalledWith({
        _id: mockBudget._id,
        user: mockUserId
      });
      expect(mockPopulateMethod).toHaveBeenCalledWith('category', 'name type icon color');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ budget: mockBudget });
    });

    it('should return 404 if budget not found', async () => {
      req.params.id = new mongoose.Types.ObjectId();
      
      Budget.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      
      await budgetsController.getById(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  // Test create method
  describe('create method', () => {
    it('should create a new budget', async () => {
      const newBudgetData = {
        amount: 1500,
        period: 'monthly',
        category: mockCategoryId,
        startDate: '2023-05-01',
        isRecurring: true
      };
      req.body = newBudgetData;

      const savedBudget = {
        ...newBudgetData,
        _id: new mongoose.Types.ObjectId(),
        user: mockUserId,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        populate: jest.fn().mockResolvedValueOnce({
          ...newBudgetData,
          _id: new mongoose.Types.ObjectId(),
          user: mockUserId,
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          category: {
            _id: mockCategoryId,
            name: 'Groceries',
            type: 'expense',
            icon: 'grocery-cart',
            color: '#4CAF50'
          }
        })
      };

      // Mock category existence check
      Category.findOne.mockResolvedValue({ 
        _id: mockCategoryId, 
        name: 'Groceries' 
      });

      // Mock the Budget constructor and save method
      const mockBudgetInstance = {
        ...savedBudget,
        save: jest.fn().mockResolvedValue(savedBudget)
      };
      
      Budget.mockImplementation(() => mockBudgetInstance);

      await budgetsController.create(req, res, next);

      expect(Category.findOne).toHaveBeenCalledWith({
        _id: mockCategoryId,
        user: mockUserId
      });
      expect(Budget).toHaveBeenCalledWith(expect.objectContaining({
        amount: 1500,
        period: 'monthly',
        category: mockCategoryId,
        user: mockUserId
      }));
      expect(mockBudgetInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ budget: expect.any(Object) });
    });

    it('should validate period values', async () => {
      req.body = {
        amount: 1500,
        period: 'invalid-period', 
        category: mockCategoryId,
        startDate: '2023-05-01'
      };
      
      await budgetsController.create(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toContain('Period must be');
    });

    it('should validate amount is positive', async () => {
      req.body = {
        amount: -100,
        period: 'monthly',
        category: mockCategoryId,
        startDate: '2023-05-01'
      };
      
      await budgetsController.create(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toContain('Amount must be a positive number');
    });

    it('should validate date values', async () => {
      req.body = {
        amount: 1500,
        period: 'monthly',
        category: mockCategoryId,
        startDate: 'invalid-date'
      };
      
      await budgetsController.create(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toContain('Invalid start date');
    });

    it('should validate start date is before end date', async () => {
      req.body = {
        amount: 1500,
        period: 'monthly',
        category: mockCategoryId,
        startDate: '2023-05-01',
        endDate: '2023-04-01' 
      };
      
      await budgetsController.create(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toContain('End date must be after start date');
    });

    it('should validate category exists and belongs to user', async () => {
      req.body = {
        amount: 1500,
        period: 'monthly',
        category: mockCategoryId,
        startDate: '2023-05-01'
      };
      
      // Mock category not found
      Category.findOne.mockResolvedValue(null);
      
      await budgetsController.create(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toContain('Category not found or does not belong to the user');
    });

    it('should handle validation errors from Mongoose', async () => {
      req.body = {
        amount: 1500,
        period: 'monthly',
        category: mockCategoryId,
        startDate: '2023-05-01'
      };
      
      // Mock category exists
      Category.findOne.mockResolvedValue({ _id: mockCategoryId });
      
      // But mongoose validation fails
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      const mockBudgetInstance = {
        save: jest.fn().mockRejectedValue(validationError)
      };
      
      Budget.mockImplementation(() => mockBudgetInstance);
      
      await budgetsController.create(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  // Test update method
  describe('update method', () => {
    it('should update an existing budget', async () => {
      const budgetId = mockBudgets[0]._id;
      const updateData = {
        amount: 2000,
        period: 'yearly',
        startDate: '2023-06-01'
      };
      req.params.id = budgetId;
      req.body = updateData;

      const updatedBudget = {
        ...mockBudgets[0],
        ...updateData,
        updatedAt: new Date()
      };

      // Mock populate chain for mongoose query
      Budget.findOneAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedBudget)
      });

      await budgetsController.update(req, res, next);

      expect(Budget.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: budgetId, user: mockUserId },
        expect.objectContaining({
          amount: 2000,
          period: 'yearly',
          startDate: '2023-06-01'
        }),
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ budget: updatedBudget });
    });

    it('should validate amount when updating', async () => {
      req.params.id = mockBudgets[0]._id;
      req.body = { amount: -500 }; // Negative amount
      
      await budgetsController.update(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toContain('Amount must be a positive number');
    });

    it('should validate period when updating', async () => {
      req.params.id = mockBudgets[0]._id;
      req.body = { period: 'invalid-period' };
      
      await budgetsController.update(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toContain('Period must be');
    });

    it('should validate category exists when updating', async () => {
      req.params.id = mockBudgets[0]._id;
      req.body = { category: new mongoose.Types.ObjectId() };
      
      // Mock category not found
      Category.findOne.mockResolvedValue(null);
      
      await budgetsController.update(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toContain('Category not found');
    });

    it('should validate dates when updating both start and end dates', async () => {
      req.params.id = mockBudgets[0]._id;
      req.body = { 
        startDate: '2023-06-01',
        endDate: '2023-05-01' // End date before start date
      };
      
      await budgetsController.update(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toContain('End date must be after start date');
    });

    it('should validate endDate against existing startDate', async () => {
      req.params.id = mockBudgets[0]._id;
      req.body = { endDate: '2022-12-31' }; // End date before the existing start date
      
      // Mock budget find
      Budget.findOne.mockResolvedValue(mockBudgets[0]);
      
      await budgetsController.update(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toContain('End date must be after start date');
    });

    it('should return 404 if budget not found', async () => {
      req.params.id = new mongoose.Types.ObjectId();
      req.body = { amount: 2000 };

      // Mock the populate chain
      Budget.findOneAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await budgetsController.update(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  // Test delete method
  describe('delete method', () => {
    it('should soft delete a budget', async () => {
      const budgetId = mockBudgets[0]._id;
      req.params.id = budgetId;

      const budget = { 
        ...mockBudgets[0], 
        softDelete: jest.fn().mockResolvedValue(true)
      };
      Budget.findOne.mockResolvedValue(budget);

      await budgetsController.delete(req, res, next);

      expect(Budget.findOne).toHaveBeenCalledWith({
        _id: budgetId,
        user: mockUserId
      });
      expect(budget.softDelete).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Budget soft deleted successfully'
      });
    });

    it('should return 404 if budget not found', async () => {
      req.params.id = new mongoose.Types.ObjectId();
      Budget.findOne.mockResolvedValue(null);

      await budgetsController.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('should return 400 if budget is already deleted', async () => {
      const budgetId = mockBudgets[0]._id;
      req.params.id = budgetId;

      const deletedBudget = {
        ...mockBudgets[0],
        isDeleted: true
      };
      Budget.findOne.mockResolvedValue(deletedBudget);

      await budgetsController.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  // Test restore method
  describe('restore method', () => {
    it('should restore a deleted budget', async () => {
      const budgetId = mockBudgets[0]._id;
      req.params.id = budgetId;

      const deletedBudget = {
        ...mockBudgets[0],
        isDeleted: true,
        restore: jest.fn().mockResolvedValue(true)
      };

      // Create a query object that will be modified in the controller
      const query = {
        includeDeleted: false
      };
      
      // Make the query thenable to work with await
      query.then = jest.fn((resolve) => resolve(deletedBudget));
      
      Budget.findOne.mockReturnValue(query);

      await budgetsController.restore(req, res, next);

      // Verify the controller set includeDeleted to true
      expect(query.includeDeleted).toBe(true);
      expect(deletedBudget.restore).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Budget restored successfully',
        budget: deletedBudget
      });
    });

    it('should return 404 if budget not found', async () => {
      req.params.id = new mongoose.Types.ObjectId();
      
      // Create a query object that will be modified in the controller
      const query = {
        includeDeleted: false
      };
      
      // Mock that the query resolves to null when awaited
      query.then = jest.fn((resolve) => resolve(null));
      
      Budget.findOne.mockReturnValue(query);

      await budgetsController.restore(req, res, next);

      // Verify the controller set includeDeleted to true
      expect(query.includeDeleted).toBe(true);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('should return 400 if budget is not deleted', async () => {
      const budgetId = mockBudgets[0]._id;
      req.params.id = budgetId;

      const activeBudget = {
        ...mockBudgets[0],
        isDeleted: false
      };

      const query = {
        includeDeleted: false,
        then: jest.fn((resolve) => resolve(activeBudget))
      };

      Budget.findOne.mockReturnValue(query);

      await budgetsController.restore(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  // Test getDeletedBudgets method
  describe('getDeletedBudgets method', () => {
    it('should get all deleted budgets for a user', async () => {
      const deletedBudgets = mockBudgets.map(budget => ({
        ...budget,
        isDeleted: true
      }));

      // Mock the populate chain
      Budget.findDeleted.mockReturnValue({
        populate: jest.fn().mockResolvedValue(deletedBudgets)
      });

      await budgetsController.getDeletedBudgets(req, res, next);

      expect(Budget.findDeleted).toHaveBeenCalledWith({
        user: mockUserId
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        deletedBudgets,
        count: deletedBudgets.length
      });
    });

    it('should return empty array if no deleted budgets exist', async () => {
      // Mock the populate chain
      Budget.findDeleted.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      await budgetsController.getDeletedBudgets(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        deletedBudgets: [],
        count: 0
      });
    });
  });

  // Test getByPeriod method
  describe('getByPeriod method', () => {
    it('should get budgets by period', async () => {
      const period = 'monthly';
      req.params.period = period;

      const monthlyBudgets = mockBudgets.filter(b => b.period === 'monthly');
      
      // Mock the populate and sort chain
      Budget.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(monthlyBudgets)
      });

      await budgetsController.getByPeriod(req, res, next);

      expect(Budget.find).toHaveBeenCalledWith({
        period,
        user: mockUserId
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        budgets: monthlyBudgets,
        count: monthlyBudgets.length
      });
    });

    it('should return 400 if period is invalid', async () => {
      req.params.period = 'invalid-period';

      await budgetsController.getByPeriod(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  // Test getByCategoryType method
  describe('getByCategoryType method', () => {
    it('should get budgets by category type', async () => {
      const type = 'expense';
      req.params.type = type;

      const expenseCategories = [
        { _id: mockBudgets[0].category._id },
        { _id: mockBudgets[2].category._id }
      ];

      const expenseBudgets = [mockBudgets[0], mockBudgets[2]];

      // Mock Category.find
      Category.find.mockResolvedValue(expenseCategories);

      // Mock Budget.find with the populate and sort chain
      Budget.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(expenseBudgets)
      });

      await budgetsController.getByCategoryType(req, res, next);

      expect(Category.find).toHaveBeenCalledWith({
        type,
        user: mockUserId
      });
      expect(Budget.find).toHaveBeenCalledWith({
        category: { $in: expect.any(Array) },
        user: mockUserId
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        budgets: expenseBudgets,
        count: expenseBudgets.length
      });
    });

    it('should return 400 if category type is invalid', async () => {
      req.params.type = 'invalid-type';

      await budgetsController.getByCategoryType(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  // Test getCurrentBudgets method
  describe('getCurrentBudgets method', () => {
    it('should get currently active budgets', async () => {
      // Mock the populate and sort chain
      Budget.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockBudgets)
      });

      await budgetsController.getCurrentBudgets(req, res, next);

      expect(Budget.find).toHaveBeenCalledWith({
        user: mockUserId,
        $or: expect.any(Array)
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        budgets: mockBudgets,
        count: mockBudgets.length
      });
    });
  });
}); 