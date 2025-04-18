const mongoose = require('mongoose');
const ReportsController = require('../../../src/controllers/reports');
const Transaction = require('../../../src/models/transactions.ts');
const Category = require('../../../src/models/categories');
const { BadRequestError } = require('../../../src/errors');

// Mock Transaction and Category models
jest.mock('../../../src/models/transactions.ts');
jest.mock('../../../src/models/categories');

describe('Reports Controller', () => {
  let reportsController;
  let req;
  let res;
  let next;
  let mockUserId;
  
  beforeEach(() => {
    reportsController = new ReportsController();
    mockUserId = new mongoose.Types.ObjectId();
    next = jest.fn();

    // Mock request object
    req = {
      user: { _id: mockUserId },
      params: {},
      query: {}
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Clear all mocks between tests
    jest.clearAllMocks();
  });

  // Test getSpendingByCategory method
  describe('getSpendingByCategory method', () => {
    it('should return spending by category report', async () => {
      // Setup request with date range
      req.query = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      // Mock spending data to be returned
      const mockSpendingData = [
        {
          categoryId: new mongoose.Types.ObjectId(),
          categoryName: 'Groceries',
          categoryIcon: 'grocery-cart',
          categoryColor: '#4CAF50',
          totalAmount: 250
        },
        {
          categoryId: new mongoose.Types.ObjectId(),
          categoryName: 'Entertainment',
          categoryIcon: 'movie',
          categoryColor: '#FF5722',
          totalAmount: 150
        }
      ];

      // Mock Transaction.aggregate to return mock data
      Transaction.aggregate.mockResolvedValue(mockSpendingData);
      
      // Call the method
      await reportsController.getSpendingByCategory(req, res, next);
      
      // Verify Transaction.aggregate was called with correct parameters
      expect(Transaction.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          $match: expect.objectContaining({
            user: mockUserId,
            type: 'expense',
            date: expect.any(Object),
            isDeleted: false
          })
        }),
        expect.objectContaining({ $lookup: expect.any(Object) }),
        expect.objectContaining({ $unwind: expect.any(String) }),
        expect.objectContaining({ $group: expect.any(Object) }),
        expect.objectContaining({ $project: expect.any(Object) }),
        expect.objectContaining({ $sort: expect.any(Object) })
      ]));

      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        type: 'spending_by_category',
        period: { startDate: '2023-01-01', endDate: '2023-01-31' },
        data: mockSpendingData,
        summary: {
          totalSpending: 400, // 250 + 150
          categoriesCount: 2
        }
      });
    });

    it('should return 400 if startDate is missing', async () => {
      // Setup request with missing startDate
      req.query = {
        endDate: '2023-01-31'
      };
      
      // Call the method
      await reportsController.getSpendingByCategory(req, res, next);
      
      // Verify error was passed to next middleware
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toBe('Start date and end date are required');
    });

    it('should return 400 if endDate is missing', async () => {
      // Setup request with missing endDate
      req.query = {
        startDate: '2023-01-01'
      };
      
      // Call the method
      await reportsController.getSpendingByCategory(req, res, next);
      
      // Verify error was passed to next middleware
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toBe('Start date and end date are required');
    });

    it('should return 400 if date format is invalid', async () => {
      // Setup request with invalid date format
      req.query = {
        startDate: 'invalid-date',
        endDate: '2023-01-31'
      };
      
      // Call the method
      await reportsController.getSpendingByCategory(req, res, next);
      
      // Verify error was passed to next middleware
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toBe('Invalid date format');
    });

    it('should handle database errors', async () => {
      // Setup request
      req.query = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };
      
      // Mock aggregate to throw error
      const dbError = new Error('Database error');
      Transaction.aggregate.mockRejectedValue(dbError);
      
      // Call the method
      await reportsController.getSpendingByCategory(req, res, next);
      
      // Verify error was passed to next middleware
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  // Test getIncomeVsExpenses method
  describe('getIncomeVsExpenses method', () => {
    it('should return income vs expenses report grouped by month', async () => {
      // Setup request with date range
      req.query = {
        startDate: '2023-01-01',
        endDate: '2023-03-31',
        groupBy: 'month'
      };

      // Mock aggregate results
      const mockAggregateResults = [
        {
          _id: '2023-01',
          types: [
            { type: 'income', amount: 1000, count: 2 },
            { type: 'expense', amount: 700, count: 5 }
          ]
        },
        {
          _id: '2023-02',
          types: [
            { type: 'income', amount: 1200, count: 2 },
            { type: 'expense', amount: 800, count: 6 }
          ]
        },
        {
          _id: '2023-03',
          types: [
            { type: 'income', amount: 1100, count: 2 },
            { type: 'expense', amount: 900, count: 7 }
          ]
        }
      ];

      // Mock Transaction.aggregate to return mock data
      Transaction.aggregate.mockResolvedValue(mockAggregateResults);
      
      // Call the method
      await reportsController.getIncomeVsExpenses(req, res, next);
      
      // Verify Transaction.aggregate was called with correct parameters
      expect(Transaction.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          $match: expect.objectContaining({
            user: mockUserId,
            date: expect.any(Object),
            isDeleted: false
          })
        }),
        expect.objectContaining({
          $group: expect.objectContaining({
            _id: expect.any(Object),
            totalAmount: expect.any(Object),
            count: expect.any(Object)
          })
        }),
        expect.objectContaining({
          $group: expect.objectContaining({
            _id: expect.any(String),
            types: expect.any(Object)
          })
        }),
        expect.objectContaining({ $sort: expect.any(Object) })
      ]));

      // Expected transformed data
      const expectedTransformedData = [
        {
          period: '2023-01',
          income: 1000,
          incomeCount: 2,
          expense: 700,
          expenseCount: 5,
          balance: 300
        },
        {
          period: '2023-02',
          income: 1200,
          incomeCount: 2,
          expense: 800,
          expenseCount: 6,
          balance: 400
        },
        {
          period: '2023-03',
          income: 1100,
          incomeCount: 2,
          expense: 900,
          expenseCount: 7,
          balance: 200
        }
      ];

      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        type: 'income_vs_expenses',
        period: { startDate: '2023-01-01', endDate: '2023-03-31', groupBy: 'month' },
        data: expectedTransformedData,
        summary: {
          totalIncome: 3300, // 1000 + 1200 + 1100
          totalExpense: 2400, // 700 + 800 + 900
          balance: 900, // 3300 - 2400
          periodCount: 3
        }
      });
    });

    it('should handle missing income or expense for a period', async () => {
      // Setup request with date range
      req.query = {
        startDate: '2023-01-01',
        endDate: '2023-02-28',
        groupBy: 'month'
      };

      // Mock aggregate results with missing types
      const mockAggregateResults = [
        {
          _id: '2023-01',
          types: [
            { type: 'income', amount: 1000, count: 2 }
            // No expense type for this period
          ]
        },
        {
          _id: '2023-02',
          types: [
            // No income type for this period
            { type: 'expense', amount: 800, count: 6 }
          ]
        }
      ];

      // Mock Transaction.aggregate to return mock data
      Transaction.aggregate.mockResolvedValue(mockAggregateResults);
      
      // Call the method
      await reportsController.getIncomeVsExpenses(req, res, next);
      
      // Expected transformed data
      const expectedTransformedData = [
        {
          period: '2023-01',
          income: 1000,
          incomeCount: 2,
          expense: 0,
          expenseCount: 0,
          balance: 1000
        },
        {
          period: '2023-02',
          income: 0,
          incomeCount: 0,
          expense: 800,
          expenseCount: 6,
          balance: -800
        }
      ];

      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        type: 'income_vs_expenses',
        period: { startDate: '2023-01-01', endDate: '2023-02-28', groupBy: 'month' },
        data: expectedTransformedData,
        summary: {
          totalIncome: 1000,
          totalExpense: 800,
          balance: 200,
          periodCount: 2
        }
      });
    });

    it('should use default month grouping when groupBy is not provided', async () => {
      // Setup request without groupBy
      req.query = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      // Mock empty result
      Transaction.aggregate.mockResolvedValue([]);
      
      // Call the method
      await reportsController.getIncomeVsExpenses(req, res, next);
      
      // Verify groupBy 'month' format was used in aggregation
      expect(Transaction.aggregate).toHaveBeenCalled();
      
      // Get the call arguments
      const callArgs = Transaction.aggregate.mock.calls[0][0];
      
      // Find the first $group stage (for initial grouping by period and type)
      const firstGroupStage = callArgs.find(stage => 
        stage.$group && stage.$group._id && stage.$group._id.period);
      
      // Extract the groupByFormat used
      const groupByFormat = firstGroupStage.$group._id.period;
      
      // Expect it to be a dateToString with month format
      expect(groupByFormat).toHaveProperty('$dateToString');
      expect(groupByFormat.$dateToString.format).toBe('%Y-%m');
    });

    it('should handle day grouping', async () => {
      // Setup request with day grouping
      req.query = {
        startDate: '2023-01-01',
        endDate: '2023-01-07',
        groupBy: 'day'
      };

      // Mock empty result
      Transaction.aggregate.mockResolvedValue([]);
      
      // Call the method
      await reportsController.getIncomeVsExpenses(req, res, next);
      
      // Verify groupBy 'day' format was used in aggregation
      expect(Transaction.aggregate).toHaveBeenCalled();
      
      // Get the call arguments
      const callArgs = Transaction.aggregate.mock.calls[0][0];
      
      // Find the first $group stage (for initial grouping by period and type)
      const firstGroupStage = callArgs.find(stage => 
        stage.$group && stage.$group._id && stage.$group._id.period);
      
      // Extract the groupByFormat used
      const groupByFormat = firstGroupStage.$group._id.period;
      
      // Expect it to be a dateToString with day format
      expect(groupByFormat).toHaveProperty('$dateToString');
      expect(groupByFormat.$dateToString.format).toBe('%Y-%m-%d');
    });

    it('should handle week grouping', async () => {
      // Setup request with week grouping
      req.query = {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        groupBy: 'week'
      };

      // Mock empty result
      Transaction.aggregate.mockResolvedValue([]);
      
      // Call the method
      await reportsController.getIncomeVsExpenses(req, res, next);
      
      // Verify groupBy 'week' format was used in aggregation
      expect(Transaction.aggregate).toHaveBeenCalled();
      
      // Get the call arguments
      const callArgs = Transaction.aggregate.mock.calls[0][0];
      
      // Find the first $group stage (for initial grouping by period and type)
      const firstGroupStage = callArgs.find(stage => 
        stage.$group && stage.$group._id && stage.$group._id.period);
      
      // Extract the groupByFormat used
      const groupByFormat = firstGroupStage.$group._id.period;
      
      // Expect it to be a concat with isoWeekYear and isoWeek
      expect(groupByFormat).toHaveProperty('$concat');
    });

    it('should handle year grouping', async () => {
      // Setup request with year grouping
      req.query = {
        startDate: '2023-01-01',
        endDate: '2024-12-31',
        groupBy: 'year'
      };

      // Mock empty result
      Transaction.aggregate.mockResolvedValue([]);
      
      // Call the method
      await reportsController.getIncomeVsExpenses(req, res, next);
      
      // Verify groupBy 'year' format was used in aggregation
      expect(Transaction.aggregate).toHaveBeenCalled();
      
      // Get the call arguments
      const callArgs = Transaction.aggregate.mock.calls[0][0];
      
      // Find the first $group stage (for initial grouping by period and type)
      const firstGroupStage = callArgs.find(stage => 
        stage.$group && stage.$group._id && stage.$group._id.period);
      
      // Extract the groupByFormat used
      const groupByFormat = firstGroupStage.$group._id.period;
      
      // Expect it to be a dateToString with year format
      expect(groupByFormat).toHaveProperty('$dateToString');
      expect(groupByFormat.$dateToString.format).toBe('%Y');
    });

    it('should return 400 if startDate is missing', async () => {
      // Setup request with missing startDate
      req.query = {
        endDate: '2023-01-31'
      };
      
      // Call the method
      await reportsController.getIncomeVsExpenses(req, res, next);
      
      // Verify error was passed to next middleware
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toBe('Start date and end date are required');
    });

    it('should return 400 if date format is invalid', async () => {
      // Setup request with invalid date format
      req.query = {
        startDate: '2023-01-01',
        endDate: 'invalid-date'
      };
      
      // Call the method
      await reportsController.getIncomeVsExpenses(req, res, next);
      
      // Verify error was passed to next middleware
      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(next.mock.calls[0][0].message).toBe('Invalid date format');
    });

    it('should handle database errors', async () => {
      // Setup request
      req.query = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };
      
      // Mock aggregate to throw error
      const dbError = new Error('Database error');
      Transaction.aggregate.mockRejectedValue(dbError);
      
      // Call the method
      await reportsController.getIncomeVsExpenses(req, res, next);
      
      // Verify error was passed to next middleware
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  // Test getMonthlyTrend method
  describe('getMonthlyTrend method', () => {
    it('should return monthly spending trend report', async () => {
      // Setup request with months parameter
      req.query = {
        months: '3'
      };

      // Mock monthly trend data
      const mockMonthlyTrend = [
        {
          month: '2023-01',
          totalAmount: 750,
          transactionCount: 12
        },
        {
          month: '2023-02',
          totalAmount: 800,
          transactionCount: 15
        },
        {
          month: '2023-03',
          totalAmount: 900,
          transactionCount: 18
        }
      ];

      // Mock Transaction.aggregate to return mock data
      Transaction.aggregate.mockResolvedValue(mockMonthlyTrend);
      
      // Call the method
      await reportsController.getMonthlyTrend(req, res, next);
      
      // Verify Transaction.aggregate was called with correct parameters
      expect(Transaction.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          $match: expect.objectContaining({
            user: mockUserId,
            type: 'expense',
            date: expect.any(Object),
            isDeleted: false
          })
        }),
        expect.objectContaining({
          $group: expect.objectContaining({
            _id: expect.any(Object),
            totalAmount: expect.any(Object),
            transactionCount: expect.any(Object)
          })
        }),
        expect.objectContaining({ $sort: expect.any(Object) }),
        expect.objectContaining({ $project: expect.any(Object) })
      ]));

      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        type: 'monthly_trend',
        period: expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String),
          months: 3
        }),
        data: mockMonthlyTrend,
        summary: {
          averageSpending: (750 + 800 + 900) / 3, // 816.6666...
          monthsCount: 3
        }
      });
    });

    it('should use default 6 months when months parameter is not provided', async () => {
      // Setup request without months parameter
      req.query = {};

      // Mock monthly trend data
      const mockMonthlyTrend = [];
      Transaction.aggregate.mockResolvedValue(mockMonthlyTrend);
      
      // Call the method
      await reportsController.getMonthlyTrend(req, res, next);
      
      // Verify months parameter defaulted to 6
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        period: expect.objectContaining({
          months: 6
        })
      }));
    });

    it('should handle database errors', async () => {
      // Setup request
      req.query = {
        months: '3'
      };
      
      // Mock aggregate to throw error
      const dbError = new Error('Database error');
      Transaction.aggregate.mockRejectedValue(dbError);
      
      // Call the method
      await reportsController.getMonthlyTrend(req, res, next);
      
      // Verify error was passed to next middleware
      expect(next).toHaveBeenCalledWith(dbError);
    });

    it('should handle empty result', async () => {
      // Setup request
      req.query = {
        months: '3'
      };
      
      // Mock empty trend data
      Transaction.aggregate.mockResolvedValue([]);
      
      // Call the method
      await reportsController.getMonthlyTrend(req, res, next);
      
      // Verify response with empty data
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        type: 'monthly_trend',
        period: expect.objectContaining({
          months: 3
        }),
        data: [],
        summary: {
          averageSpending: 0,
          monthsCount: 0
        }
      });
    });
  });
}); 