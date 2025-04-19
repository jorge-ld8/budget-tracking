import Category from '../models/categories.ts';
import Budget from '../models/budgets.ts';
import { NotFoundError, BadRequestError } from '../errors/index.ts';
import { BaseController } from '../interfaces/BaseController.ts';

class BudgetsController extends BaseController {
  constructor() {
    super();
  }

  async getAll(req, res, next) {
    try {
      const { period, category, sort, fields, page, limit, startDate, endDate, numericFilters } = req.query;

      const queryObject : any = {};
      
      // Only return budgets that belong to the current user
      queryObject.user = req.user._id;
      
      if (period) {
        queryObject.period = period;
      }
      
      if (category) {
        queryObject.category = category;
      }
      
      // Date range filtering
      if (startDate || endDate) {
        // We can filter by either budget start or end dates
        
        // If filtering by budget start date
        if (startDate) {
          queryObject.startDate = queryObject.startDate || {};
          queryObject.startDate.$gte = new Date(startDate);
        }
        
        if (endDate) {
          //  we need to consider :
          // 1. Budgets with an actual endDate that falls within our range
          // 2. Recurring budgets that started before our endDate
          
          // We'll use $or for this complex query
          queryObject.$or = queryObject.$or || [];
          
          // Case 1: Budgets with an actual endDate within our range
          const endDateFilter = { 
            endDate: { $lte: new Date(endDate), $ne: null } 
          };
          queryObject.$or.push(endDateFilter);
          
          // Case 2: Recurring budgets (or null endDate) that started before our endDate
          const recurringFilter = {
            startDate: { $lte: new Date(endDate) },
            $or: [
              { isRecurring: true },
              { endDate: null }
            ]
          };
          queryObject.$or.push(recurringFilter);
        }
      }
      
      // Numeric filters
      if (numericFilters) {
        const operatorMap = {
          '>': '$gt',
          '>=': '$gte',
          '<': '$lt',
          '<=': '$lte',
          '=': '$eq',
          '!=': '$ne'
        };
        const regex = /\b(<|>|>=|<=|=|!=)\b/g;
        let filters = numericFilters.replace(regex, (match) => `-${operatorMap[match]}-`);
        const options = ['amount'];
        filters.split(',').forEach((item) => {
          const [field, operator, value] = item.split('-');
          if (options.includes(field)) {
            queryObject[field] = { [operator]: Number(value) };
          }
        });
      }
      
      let result = Budget.find(queryObject);

      // Add category details to the result
      result = result.populate('category', 'name type icon color');

      if (sort) {
        const sortFields = sort.split(',').join(' ');
        result = result.sort(sortFields);
      } else {
        // Default sort by creation date
        result = result.sort('-createdAt');
      }
      
      if (fields) {
        const fieldsList = fields.split(',').join(' ');
        result = result.select(fieldsList);
      }
      
      // Pagination
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;
      
      result = result.skip(skip).limit(limitNumber);
      
      const budgets = await result;
      
      // Count total documents for pagination
      const totalDocuments = await Budget.countDocuments(queryObject);
      
      res.status(200).json({ 
        budgets, 
        count: budgets.length,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalDocuments / limitNumber)
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    const { id } = req.params;
    
    const budget = await Budget.findOne({
      _id: id,
      user: req.user._id
    }).populate('category', 'name type icon color');
    
    if (!budget) {
      return next(new NotFoundError('Budget not found'));
    }
    
    res.status(200).json({ budget });
  }

  async create(req, res, next) {
    try {
      const { amount, period, category, startDate, endDate, isRecurring } = req.body;
      
      // Validate dates
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return next(new BadRequestError('Invalid start date'));
      }
      
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return next(new BadRequestError('Invalid end date'));
      }
      
      if (end <= start) {
        return next(new BadRequestError('End date must be after start date'));
      }
      
      // Verify that the category exists and belongs to the user
      const categoryExists = await Category.findOne({
        _id: category,
        user: req.user._id
      });
      
      if (!categoryExists) {
        return next(new BadRequestError('Category not found or does not belong to the user'));
      }
      
      // Create the budget
      const budgetData = {
        amount,
        period,
        category,
        startDate,
        endDate,
        isRecurring: isRecurring !== undefined ? isRecurring : true,
        user: req.user._id
      };
      
      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();
      
      // Populate category details for the response
      await savedBudget.populate('category', 'name type icon color');
      
      res.status(201).json({ budget: savedBudget });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return next(new BadRequestError(`Validation Error: ${error.message}`));
      }
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { category, startDate, endDate } = req.body;
      
      // Build update object with only provided fields
      const categoryExists = await Category.findOne({
        _id: category,
        user: req.user._id
      });
        
      if (!categoryExists) {
        return next(new BadRequestError('Category not found or does not belong to the user'));
      }

      if (!startDate) {
          // If only end date is being updated, get the current budget to check against its start date
          const currentBudget = await Budget.findOne({
            _id: id,
            user: req.user._id
          });
        
          if (!currentBudget) {
            return next(new NotFoundError('Budget not found'));
          }
          const end = new Date(endDate);
          const currentStart = new Date(currentBudget.startDate);
          if (end <= currentStart) {
            return next(new BadRequestError('End date must be after start date'));
          }
      }

      const updateData : any = req.body;
      const budget = await Budget.findOneAndUpdate(
        { _id: id, user: req.user._id },
        updateData, 
        { new: true, runValidators: true }
      ).populate('category', 'name type icon color');
      
      if (!budget) {
        return next(new NotFoundError('Budget not found'));
      }
      
      res.status(200).json({ budget });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return next(new BadRequestError(`Validation Error: ${error.message}`));
      }
      next(error);
    }
  }

  async delete(req, res, next) {
    const { id } = req.params;
    
    const budget = await Budget.findOne({
      _id: id,
      user: req.user._id
    });
    
    if (!budget) {
      return next(new NotFoundError('Budget not found'));
    }
    
    if (budget.isDeleted) {
      return next(new BadRequestError('Budget is already deleted'));
    }
    
    await budget.softDelete();
    res.status(200).json({ message: 'Budget soft deleted successfully' });
  }
  
  async restore(req, res, next) {
    const { id } = req.params;
    
    // Set includeDeleted flag to allow finding deleted items
    const query : any = Budget.findOne({
      _id: id,
      user: req.user._id
    });
    query.includeDeleted = true;
    
    const budget = await query;

    if (!budget) {
      return next(new NotFoundError('Budget not found'));
    }
    
    if (!budget.isDeleted) {
      return next(new BadRequestError('Budget is not deleted'));
    }
    
    await budget.restore();
    res.status(200).json({ message: 'Budget restored successfully', budget });
  }

  async getDeletedBudgets(req, res) {
    const deletedBudgets = await Budget.findDeleted({
      user: req.user._id
    });

    res.status(200).json({ 
      deletedBudgets,
      count: deletedBudgets.length
    });
  }
  
  async getByPeriod(req, res, next) {
    const { period } = req.params;
    const budgets = await Budget.find({
      period,
      user: req.user._id
    }).populate('category', 'name type icon color').sort('-createdAt');
    
    res.status(200).json({ 
      budgets,
      count: budgets.length
    });
  }
  
  async getByCategoryType(req, res, next) {
    const { type } = req.params;
    
    const categories = await Category.find({
      type,
      user: req.user._id
    });
    
    const categoryIds = categories.map(cat => cat._id);
    
    // Then, get all budgets for these categories
    const budgets = await Budget.find({
      category: { $in: categoryIds },
      user: req.user._id
    }).populate('category', 'name type icon color').sort('-createdAt');
    
    res.status(200).json({ 
      budgets,
      count: budgets.length
    });
  }
  
  async getCurrent(req, res) {
    const today = new Date();
    
    // Get budgets that are currently active
    const budgets = await Budget.find({
      user: req.user._id,
      $or: [
        // Recurring budgets that started before today
        { isRecurring: true, startDate: { $lte: today } },
        // Non-recurring budgets that are within their date range
        { 
          isRecurring: false, 
          startDate: { $lte: today },
          $or: [
            { endDate: { $gte: today } },
            { endDate: null }
          ]
        }
      ]
    }).populate('category', 'name type icon color').sort('-createdAt');
    
    res.status(200).json({ 
      budgets,
      count: budgets.length
    });
  }

  async getAllAdmin(req, res, next) {
    try {
      const { period, category, sort, fields, page, limit, startDate, endDate, user, numericFilters } = req.query;

      const queryObject : any = {};
      
      // Admin can filter by user
      if (user) {
        queryObject.user = user;
      }
      
      if (period) {
        queryObject.period = period;
      }
      
      if (category) {
        queryObject.category = category;
      }
      
      // Date range filtering
      if (startDate || endDate) {
        if (startDate) {
          queryObject.startDate = queryObject.startDate || {};
          queryObject.startDate.$gte = new Date(startDate);
        }
        
        if (endDate) {
          queryObject.$or = queryObject.$or || [];
          queryObject.$or.push({ endDate: { $lte: new Date(endDate), $ne: null } });
          queryObject.$or.push({
            startDate: { $lte: new Date(endDate) },
            $or: [
              { isRecurring: true },
              { endDate: null }
            ]
          });
        }
      }
      
      // Numeric filters
      if (numericFilters) {
        const operatorMap = {
          '>': '$gt',
          '>=': '$gte',
          '<': '$lt',
          '<=': '$lte',
          '=': '$eq',
          '!=': '$ne'
        };
        const regex = /\b(<|>|>=|<=|=|!=)\b/g;
        let filters = numericFilters.replace(regex, (match) => `-${operatorMap[match]}-`);
        const options = ['amount'];
        filters.split(',').forEach((item) => {
          const [field, operator, value] = item.split('-');
          if (options.includes(field)) {
            queryObject[field] = { [operator]: Number(value) };
          }
        });
      }
      
      let result = Budget.find(queryObject);

      // Populate category and user details
      result = result.populate('category', 'name type icon color')
                    .populate('user', 'username email firstName lastName');

      if (sort) {
        const sortFields = sort.split(',').join(' ');
        result = result.sort(sortFields);
      } else {
        result = result.sort('-createdAt');
      }
      
      if (fields) {
        const fieldsList = fields.split(',').join(' ');
        result = result.select(fieldsList);
      }
      
      // Pagination
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;
      
      result = result.skip(skip).limit(limitNumber);
      
      const budgets = await result;
      const totalDocuments = await Budget.countDocuments(queryObject);
      
      res.status(200).json({ 
        budgets, 
        count: budgets.length,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalDocuments / limitNumber)
      });
    } catch (error) {
      next(error);
    }
  }

  async getByIdAdmin(req, res, next) {
    try {
      const { id } = req.params;
      
      const budget = await Budget.findById(id)
        .populate('category', 'name type icon color')
        .populate('user', 'username email firstName lastName');
      
      if (!budget) {
        return next(new NotFoundError('Budget not found'));
      }
      
      res.status(200).json({ budget });
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req, res, next) {
    try {
      const { amount, period, category, startDate, endDate, isRecurring, user } = req.body;
      
      // Validate period
      if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
        return next(new BadRequestError('Period must be daily, weekly, monthly, or yearly'));
      }
      
      // Validate that amount is a positive number
      if (isNaN(amount) || amount <= 0) {
        return next(new BadRequestError('Amount must be a positive number'));
      }
      
      // Validate dates
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return next(new BadRequestError('Invalid start date'));
      }
      
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return next(new BadRequestError('Invalid end date'));
        }
        
        if (end <= start) {
          return next(new BadRequestError('End date must be after start date'));
        }
      }
      
      // Check if user exists
      const User = require('../models/users.ts');
      const userExists = await User.findById(user);
      
      if (!userExists) {
        return next(new NotFoundError('User not found'));
      }
      
      // Verify that the category exists
      const categoryExists = await Category.findById(category);
      
      if (!categoryExists) {
        return next(new BadRequestError('Category not found'));
      }
      
      // Create the budget
      const budget = new Budget({
        amount,
        period,
        category,
        startDate,
        endDate,
        isRecurring: isRecurring !== undefined ? isRecurring : true,
        user
      });
      
      const savedBudget = await budget.save();
      
      // Populate category and user details for the response
      await savedBudget.populate('category', 'name type icon color');
      await savedBudget.populate('user', 'username email firstName lastName');
      
      res.status(201).json({ budget: savedBudget });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return next(new BadRequestError(`Validation Error: ${error.message}`));
      }
      next(error);
    }
  }

  async updateAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, period, category, startDate, endDate, isRecurring, user } = req.body;
      
      // Build update object with only provided fields
      const updateData : any = {};
      
      if (amount !== undefined) {
        if (isNaN(amount) || amount <= 0) {
          return next(new BadRequestError('Amount must be a positive number'));
        }
        updateData.amount = amount;
      }
      
      if (period !== undefined) {
        if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
          return next(new BadRequestError('Period must be daily, weekly, monthly, or yearly'));
        }
        updateData.period = period;
      }
      
      if (category !== undefined) {
        // Verify that the category exists
        const categoryExists = await Category.findById(category);
        
        if (!categoryExists) {
          return next(new BadRequestError('Category not found'));
        }
        
        updateData.category = category;
      }
      
      if (user !== undefined) {
        // Verify the user exists
        const User = require('../models/users.ts');
        const userExists = await User.findById(user);
        
        if (!userExists) {
          return next(new NotFoundError('User not found'));
        }
        
        updateData.user = user;
      }
      
      if (startDate !== undefined) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return next(new BadRequestError('Invalid start date'));
        }
        updateData.startDate = startDate;
      }
      
      if (endDate !== undefined) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return next(new BadRequestError('Invalid end date'));
        }
        
        // If both start and end dates are being updated, check their relationship
        if (updateData.startDate) {
          const start = new Date(updateData.startDate);
          if (end <= start) {
            return next(new BadRequestError('End date must be after start date'));
          }
        } else {
          // If only end date is being updated, get the current budget to check against its start date
          const currentBudget = await Budget.findById(id);
          
          if (!currentBudget) {
            return next(new NotFoundError('Budget not found'));
          }
          
          const currentStart = new Date(currentBudget.startDate);
          if (end <= currentStart) {
            return next(new BadRequestError('End date must be after start date'));
          }
        }
        
        updateData.endDate = endDate;
      }
      
      if (isRecurring !== undefined) {
        updateData.isRecurring = isRecurring;
      }
      
      const budget = await Budget.findByIdAndUpdate(
        id,
        updateData, 
        { new: true, runValidators: true }
      )
      .populate('category', 'name type icon color')
      .populate('user', 'username email firstName lastName');
      
      if (!budget) {
        return next(new NotFoundError('Budget not found'));
      }
      
      res.status(200).json({ budget });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return next(new BadRequestError(`Validation Error: ${error.message}`));
      }
      next(error);
    }
  }

  async deleteAdmin(req, res, next) {
    try {
      const { id } = req.params;
      
      const budget = await Budget.findById(id);
      
      if (!budget) {
        return next(new NotFoundError('Budget not found'));
      }
      
      if (budget.isDeleted) {
        return next(new BadRequestError('Budget is already deleted'));
      }
      
      await budget.softDelete();
      res.status(200).json({ 
        message: 'Budget soft deleted successfully',
        budgetId: budget._id  
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreAdmin(req, res, next) {
    try {
      const { id } = req.params;
      
      // Set includeDeleted flag to allow finding deleted items
      const query : any = Budget.findById(id);
      query.includeDeleted = true;
      
      const budget = await query;
      
      if (!budget) {
        return next(new NotFoundError('Budget not found'));
      }
      
      if (!budget.isDeleted) {
        return next(new BadRequestError('Budget is not deleted'));
      }
      
      await budget.restore();
      res.status(200).json({ 
        message: 'Budget restored successfully', 
        budget 
      });
    } catch (error) {
      next(error);
    }
  }
}

export default BudgetsController;   