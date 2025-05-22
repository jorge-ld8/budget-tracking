import type { Response, NextFunction } from 'express';
import BudgetService from '../services/BudgetService.ts'; // Import the service
import { BadRequestError } from '../errors/index.ts';
// import Budget from '../models/budgets.ts';
import type { AuthenticatedRequest } from '../types/index.d.ts';
import type { BudgetQueryFiltersDto, CreateBudgetDto, UpdateBudgetDto, CreateBudgetAdminDto, UpdateBudgetAdminDto, BudgetPeriod } from '../types/dtos/budget.dto.ts';
// Assuming IBudgetController interface might be out of sync after refactor
import type { BudgetController as IBudgetController } from '../types/controllers.ts';

// class BudgetsController implements IBudgetController {
class BudgetController implements IBudgetController {
    // Use the imported singleton instance
    private budgetService : BudgetService;

    constructor() {
      this.budgetService = new BudgetService();
    }

    async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const filters: BudgetQueryFiltersDto = req.query;

            // Use service method
            const { items : budgets, totalDocuments } = await this.budgetService.getAll(userId, filters);

            const pageNumber = Number(filters.page) || 1;
            const limitNumber = Number(filters.limit) || 10;

            res.status(200).json({
                budgets, // Rename items to budgets for API response consistency
                count: budgets?.length || 0,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalDocuments / limitNumber),
                total: totalDocuments
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const budgetId = req.params.id;
            const userId = req.user._id.toString();

            // Use service method
            const budget = await this.budgetService.findById(budgetId, userId);
            res.status(200).json({ budget });
        } catch (error) {
            next(error);
        }
    }

    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
             if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const budgetData: CreateBudgetDto = req.body;

            // Basic validation (move comprehensive validation to middleware/service)
            if (!budgetData.category || !budgetData.amount || !budgetData.period || !budgetData.startDate) {
                 throw new BadRequestError('Missing required fields: category, amount, period, startDate.');
            }

            // Use service method
            const budget = await this.budgetService.create(userId, budgetData);
            res.status(201).json({ budget });
        } catch (error) {
            next(error);
        }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const budgetId = req.params.id;
            const userId = req.user._id.toString();
            const updateData: UpdateBudgetDto = req.body;

            if (Object.keys(updateData).length === 0) {
                throw new BadRequestError('No update data provided.');
            }

            // Use service method
            const updatedBudget = await this.budgetService.update(budgetId, userId, updateData);
            res.status(200).json({ budget: updatedBudget });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const budgetId = req.params.id;
            const userId = req.user._id.toString();

            // Use service method
            const deletedId = await this.budgetService.delete(budgetId, userId);
            res.status(200).json({ message: 'Budget soft deleted successfully', budgetId: deletedId });
        } catch (error) {
            next(error);
        }
    }

    async restore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
             if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const budgetId = req.params.id;
            const userId = req.user._id.toString();

            // Use service method
            const budget = await this.budgetService.restore(budgetId, userId);
            res.status(200).json({ message: 'Budget restored successfully', budget });
        } catch (error) {
            next(error);
        }
    }

    async getDeleted(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();

            // Use service method
            const deletedBudgets = await this.budgetService.getDeleted(userId);
            res.status(200).json({
                deletedBudgets,
                count: deletedBudgets.length
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== Admin-only methods ====================

    async getAllAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const filters: BudgetQueryFiltersDto = req.query;
            // Use service method with null userId
            const { items, totalDocuments } = await this.budgetService.getAll(null, filters);

            const pageNumber = Number(filters.page) || 1;
            const limitNumber = Number(filters.limit) || 50;

             res.status(200).json({
                budgets: items, // Rename for API response
                count: items.length,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalDocuments / limitNumber),
                total: totalDocuments
            });
        } catch (error) {
            next(error);
        }
    }

    async getByIdAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const budgetId = req.params.id;
            // Use service method with null userId
            const budget = await this.budgetService.findById(budgetId, null);
            res.status(200).json({ budget });
        } catch (error) {
            next(error);
        }
    }

    async createAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const budgetData: CreateBudgetAdminDto = req.body;
            // Basic validation
            if (!budgetData.user || !budgetData.category || !budgetData.amount || !budgetData.period || !budgetData.startDate) {
                 throw new BadRequestError('Missing required fields: user, category, amount, period, startDate.');
            }

            // Use service method
            const budget = await this.budgetService.createAdmin(budgetData);
            res.status(201).json({ budget });
        } catch (error) {
            next(error);
        }
    }

    async updateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const budgetId = req.params.id;
            const updateData: UpdateBudgetAdminDto = req.body;

            if (Object.keys(updateData).length === 0) {
                throw new BadRequestError('No update data provided.');
            }

            // Use service method
            const updatedBudget = await this.budgetService.updateAdmin(budgetId, updateData);
            res.status(200).json({ budget: updatedBudget });
        } catch (error) {
            next(error);
        }
    }

    async deleteAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const budgetId = req.params.id;
            // Use service method with null userId
            const deletedId = await this.budgetService.delete(budgetId, null);
            res.status(200).json({ message: 'Budget soft deleted successfully by admin', budgetId: deletedId });
        } catch (error) {
            next(error);
        }
    }

    async restoreAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const budgetId = req.params.id;
            // Use service method with null userId
            const budget = await this.budgetService.restore(budgetId, null);
            res.status(200).json({ message: 'Budget restored successfully by admin', budget });
        } catch (error) {
            next(error);
        }
    }

     async getDeletedAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
         try {
             // Use service method with null userId
             const deletedBudgets = await this.budgetService.getDeleted(null);
             res.status(200).json({
                 deletedBudgets,
                 count: deletedBudgets.length
             });
         } catch (error) {
             next(error);
         }
     }

    async getByPeriod(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const period = req.params.period as BudgetPeriod;

            // Basic validation for period if not handled by a schema validator already
            const validPeriods: BudgetPeriod[] = ['weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
            if (!validPeriods.includes(period)) {
                throw new BadRequestError('Invalid budget period specified.');
            }

            const budgets = await this.budgetService.getByPeriod(userId, period);
            res.status(200).json({ budgets, count: budgets.length });
        } catch (error) {
            next(error);
        }
    }

    async getByCategoryType(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const categoryType = req.params.type as 'income' | 'expense';

            if (categoryType !== 'income' && categoryType !== 'expense') {
                throw new BadRequestError('Invalid category type specified. Must be "income" or "expense".');
            }

            const budgets = await this.budgetService.getByCategoryType(userId, categoryType);
            res.status(200).json({ budgets, count: budgets.length });
        } catch (error) {
            next(error);
        }
    }

    async getCurrent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();

            const budgets = await this.budgetService.getCurrent(userId);
            res.status(200).json({ budgets, count: budgets.length });
        } catch (error) {
            next(error);
        }
    }
}

export default BudgetController;   