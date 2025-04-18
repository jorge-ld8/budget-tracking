import { BaseController } from '../interfaces/BaseController.ts';
import { BadRequestError } from '../errors/index.ts';
import Transaction from '../models/transactions.ts';

class ReportsController extends BaseController {
  constructor() {
    super();
  }

  // Get spending by category for a specific period
  async getSpendingByCategory(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return next(new BadRequestError('Start date and end date are required'));
      }
      
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return next(new BadRequestError('Invalid date format'));
      }
      
      // Aggregate transactions by category
      const spendingByCategory = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'expense',
            date: { $gte: startDateObj, $lte: endDateObj },
            isDeleted: false
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryData'
          }
        },
        {
          $unwind: '$categoryData'
        },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            category: { $first: '$categoryData' }
          }
        },
        {
          $project: {
            _id: 0,
            categoryId: '$_id',
            categoryName: '$category.name',
            categoryIcon: '$category.icon',
            categoryColor: '$category.color',
            totalAmount: 1
          }
        },
        {
          $sort: { totalAmount: -1 }
        }
      ]);
      
      // Calculate total spending
      const totalSpending = spendingByCategory.reduce((sum, item) => sum + item.totalAmount, 0);
      
      res.status(200).json({
          type: 'spending_by_category',
          period: { startDate, endDate },
          data: spendingByCategory,
          summary: {
            totalSpending,
            categoriesCount: spendingByCategory.length
          }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get income vs expenses for a period
  async getIncomeVsExpenses(req, res, next) {
    try {
      const { startDate, endDate, groupBy = 'month' } = req.query;
      
      if (!startDate || !endDate) {
        return next(new BadRequestError('Start date and end date are required'));
      }
      
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return next(new BadRequestError('Invalid date format'));
      }
      
      // Define group by format
      let groupByFormat;
      switch (groupBy) {
        case 'day':
          groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
          break;
        case 'week':
          groupByFormat = { 
            $concat: [
              { $toString: { $isoWeekYear: '$date' } }, 
              '-W', 
              { $toString: { $isoWeek: '$date' } }
            ] 
          };
          break;
        case 'month':
          groupByFormat = { $dateToString: { format: '%Y-%m', date: '$date' } };
          break;
        case 'year':
          groupByFormat = { $dateToString: { format: '%Y', date: '$date' } };
          break;
        default:
          groupByFormat = { $dateToString: { format: '%Y-%m', date: '$date' } };
      }
      
      // Aggregate income and expenses by period
      const results = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: startDateObj, $lte: endDateObj },
            isDeleted: false
          }
        },
        {
          $group: {
            _id: {
              period: groupByFormat,
              type: '$type'
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.period',
            types: {
              $push: {
                type: '$_id.type',
                amount: '$totalAmount',
                count: '$count'
              }
            }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);
      
      // Transform the data to a more usable format
      const transformedData = results.map(item => {
        const incomeData = item.types.find(t => t.type === 'income') || { amount: 0, count: 0 };
        const expenseData = item.types.find(t => t.type === 'expense') || { amount: 0, count: 0 };
        
        return {
          period: item._id,
          income: incomeData.amount,
          incomeCount: incomeData.count,
          expense: expenseData.amount,
          expenseCount: expenseData.count,
          balance: incomeData.amount - expenseData.amount
        };
      });
      
      // Calculate overall summary
      const totalIncome = transformedData.reduce((sum, item) => sum + item.income, 0);
      const totalExpense = transformedData.reduce((sum, item) => sum + item.expense, 0);
      
      res.status(200).json({
          type: 'income_vs_expenses',
          period: { startDate, endDate, groupBy },
          data: transformedData,
          summary: {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            periodCount: transformedData.length
          }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get monthly spending trend
  async getMonthlyTrend(req, res, next) {
    try {
      const { months = 6 } = req.query;
      
      // Calculate start date (n months ago)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - parseInt(months));
      
      // Aggregate monthly spending
      const monthlyTrend = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'expense',
            date: { $gte: startDate, $lte: endDate },
            isDeleted: false
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            month: '$_id',
            totalAmount: 1,
            transactionCount: 1
          }
        }
      ]);
      
      res.status(200).json({
          type: 'monthly_trend',
          period: { 
            startDate: startDate.toISOString().split('T')[0], 
            endDate: endDate.toISOString().split('T')[0],
            months: parseInt(months)
          },
          data: monthlyTrend,
          summary: {
            averageSpending: monthlyTrend.length > 0 
              ? monthlyTrend.reduce((sum, month) => sum + month.totalAmount, 0) / monthlyTrend.length 
              : 0,
            monthsCount: monthlyTrend.length
          }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ReportsController;