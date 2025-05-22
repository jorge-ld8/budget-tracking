import { Types } from 'mongoose';
import Budget from '../models/budgets.ts';
import User from '../models/users.ts'; // Needed for admin checks
import Category from '../models/categories.ts'; // Needed for validation
import { NotFoundError, BadRequestError } from '../errors/index.ts';
import type { IBudgetSchema } from '../types/models/budgets.types.ts';
import type { BudgetQueryFiltersDto, CreateBudgetDto, UpdateBudgetDto, CreateBudgetAdminDto, UpdateBudgetAdminDto, BudgetPeriod } from '../types/dtos/budget.dto.ts';
import type { IBaseService } from '../types/services/base.service.types.ts';

class BudgetService implements IBaseService<IBudgetSchema, CreateBudgetDto, UpdateBudgetDto, BudgetQueryFiltersDto> {
    // Helper to build query object
    private buildQueryObject(userId: string | null, filters: BudgetQueryFiltersDto): any {
        const queryObject: any = {};

        if (userId) {
            queryObject.user = new Types.ObjectId(userId);
        } else if (filters.user) {
            try {
                queryObject.user = new Types.ObjectId(filters.user);
            } catch (e) {
                throw new BadRequestError("Invalid user ID format in filter");
            }
        }

        if (filters.category) {
            try {
                queryObject.category = new Types.ObjectId(filters.category);
            } catch (e) {
                throw new BadRequestError("Invalid category ID format in filter");
            }
        }
        if (filters.period) {
            queryObject.period = filters.period;
        }

        // Date range filtering (simplified - adjust based on period logic if needed)
        if (filters.startDate || filters.endDate) {
            queryObject.startDate = {}; // Filter on budget start date
            if (filters.startDate) {
                try { queryObject.startDate.$gte = new Date(filters.startDate); } catch (e) { /* ignore */ }
            }
            if (filters.endDate) {
                 try { queryObject.startDate.$lte = new Date(filters.endDate); } catch (e) { /* ignore */ }
            }
        }

        return queryObject;
    }

    // --- IBaseService Implementation ---

    async getAll(userId: string | null, filters: BudgetQueryFiltersDto): Promise<{ items: IBudgetSchema[], totalDocuments: number }> {
        const queryObject = this.buildQueryObject(userId, filters);
        let query : any = Budget.find(queryObject);

        // Sorting
        if (filters.sort) {
            const sortFields = filters.sort.split(',').join(' ');
            query = query.sort(sortFields);
        } else {
            query = query.sort('-startDate'); // Default sort
        }

        // Field selection
        if (filters.fields) {
            const fieldsList = filters.fields.split(',').join(' ');
            query = query.select(fieldsList);
        }

        // Pagination
        const pageNumber = Number(filters.page) || 1;
        const limitNumber = Number(filters.limit) || (userId ? 10 : 50);
        const skip = (pageNumber - 1) * limitNumber;
        query = query.skip(skip).limit(limitNumber);

        // Populate related data
        if (!userId) { // Populate user for admin
            query = query.populate('user', 'username email firstName lastName');
        }

        const items = await query.exec() as IBudgetSchema[];
        const totalDocuments = await (Budget as any).countDocuments(queryObject).exec();

        return { items, totalDocuments };
    }

    async findById(id: string, userId: string | null): Promise<IBudgetSchema> {
        let budgetId: Types.ObjectId;
        try {
            budgetId = new Types.ObjectId(id);
        } catch (e) {
            throw new BadRequestError("Invalid budget ID format");
        }

        const queryFilter: any = { _id: budgetId };
        if (userId) {
            queryFilter.user = new Types.ObjectId(userId);
        }

        let budgetQuery = Budget.findOne(queryFilter)
            // .populate('category', 'name type icon color');

        if (!userId) { // Populate user for admin
            budgetQuery = budgetQuery.populate('user', 'username email firstName lastName');
        }

        const budget = await budgetQuery.exec();

        if (!budget) {
            throw new NotFoundError(`Budget not found with id ${id}${userId ? ' for the current user' : ''}`);
        }
        return budget;
    }

    async create(userId: string, data: CreateBudgetDto): Promise<IBudgetSchema> {
        let ownerUserId: Types.ObjectId;
        let categoryId: Types.ObjectId;

        try {
            ownerUserId = new Types.ObjectId(userId);
            categoryId = new Types.ObjectId(data.category);
        } catch (e) {
            throw new BadRequestError("Invalid user or category ID format.");
        }

        // Validate category exists and belongs to user (if categories are user-specific)
        const category = await Category.findOne({ _id: categoryId /* , user: ownerUserId */ }); // Add user check if needed
        if (!category) {
            throw new NotFoundError(`Category not found with id ${data.category}`);
        }

        if (data.period === 'custom' && !data.endDate) {
            throw new BadRequestError('End date is required for custom budget periods.');
        }

        const budgetData: Partial<IBudgetSchema> = {
            user: ownerUserId,
            category: categoryId,
            amount: data.amount,
            period: data.period,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : undefined,
        };

        const budget = new Budget(budgetData);
        await budget.save();
        await budget.populate('category', 'name type icon color'); // Populate category info
        return budget;
    }

    async update(id: string, userId: string, data: UpdateBudgetDto): Promise<IBudgetSchema> {
        const budget = await this.findById(id, userId); // Checks ownership and existence

        // Validate category if changed
        if (data.category) {
            let categoryId: Types.ObjectId;
            try {
                categoryId = new Types.ObjectId(data.category);
            } catch (e) {
                throw new BadRequestError("Invalid category ID format.");
            }
            const categoryExists = await Category.findOne({ _id: categoryId /* , user: budget.user */ }); // Add user check if needed
            if (!categoryExists) {
                throw new NotFoundError(`Category not found with id ${data.category}`);
            }
            budget.category = categoryId;
        }

        // Validate end date if period is custom
        const newPeriod = data.period || budget.period;
        let newEndDate = data.endDate ? new Date(data.endDate) : budget.endDate;

        if (newPeriod === 'custom' && !newEndDate) {
            throw new BadRequestError('End date is required for custom budget periods.');
        }

        // Update fields selectively
        if (data.amount !== undefined) budget.amount = data.amount;
        if (data.period !== undefined) budget.period = data.period;
        if (data.startDate !== undefined) budget.startDate = new Date(data.startDate);
        
        if (data.endDate === null || data.endDate === undefined) {
            budget.endDate = data.endDate as any;
        } else if (data.endDate) {
            budget.endDate = new Date(data.endDate);
        }
        
        // if (newPeriod !== 'custom' && data.period !== undefined && data.period !== 'custom') {
        //     budget.endDate = undefined;
        // }

        await budget.save();
        await budget.populate('category', 'name type icon color'); // Populate category info
        return budget;
    }

    async delete(id: string, userId: string | null): Promise<Types.ObjectId> {
        // findById will throw NotFoundError if not found or user doesn't own it
        const budget = await this.findById(id, userId);
        await Budget.deleteOne({ _id: budget._id }); // Using the plugin's deleteOne
        return budget._id;
    }

    async restore(id: string, userId: string | null): Promise<IBudgetSchema> {
        let budgetId: Types.ObjectId;
        try {
            budgetId = new Types.ObjectId(id);
        } catch (e) {
            throw new BadRequestError("Invalid budget ID format");
        }

        const queryFilter: any = { _id: budgetId };
        if (userId) {
            queryFilter.user = new Types.ObjectId(userId);
        }

        const budget = await (Budget as any).findOneDeleted(queryFilter).exec();

        if (!budget) {
            throw new NotFoundError(`Deleted budget not found with id ${id}${userId ? ' for the current user' : ''}`);
        }

        await budget.restore();
        await budget.populate('category', 'name type icon color'); // Populate category info
        return budget;
    }

    async getDeleted(userId: string | null): Promise<IBudgetSchema[]> {
        const queryFilter: any = {};
        if (userId) {
            queryFilter.user = new Types.ObjectId(userId);
        }
        const deletedBudgets = await (Budget as any).findDeleted(queryFilter)
            .populate('category', 'name type icon color')
            .exec() as IBudgetSchema[];
        return deletedBudgets;
    }

    // --- Additional specific methods for Budgets ---
    async getByPeriod(userId: string, period: BudgetPeriod): Promise<IBudgetSchema[]> {
        const ownerUserId = new Types.ObjectId(userId);
        const budgets = await Budget.find({
            user: ownerUserId,
            period: period,
            isActive: true // Typically, users only want to see active budgets here
        })
        .populate('category', 'name type icon color')
        .sort('-startDate')
        .exec() as IBudgetSchema[];
        return budgets;
    }

    async getByCategoryType(userId: string, categoryType: 'income' | 'expense'): Promise<IBudgetSchema[]> {
        const ownerUserId = new Types.ObjectId(userId);

        // Find categories of the given type belonging to the user
        const categories = await Category.find({
            user: ownerUserId, // Assuming categories are user-specific, or remove this filter
            type: categoryType
        }).select('_id');

        if (categories.length === 0) {
            return []; // No categories of this type, so no budgets
        }
        const categoryIds = categories.map(cat => cat._id);

        const budgets = await Budget.find({
            user: ownerUserId,
            category: { $in: categoryIds },
            isActive: true
        })
        .populate('category', 'name type icon color')
        .sort('-startDate')
        .exec() as IBudgetSchema[];
        return budgets;
    }

    async getCurrent(userId: string): Promise<IBudgetSchema[]> {
        const ownerUserId = new Types.ObjectId(userId);
        const today = new Date();

        // Find budgets that are currently active
        // This logic can be complex depending on how isRecurring and endDate are handled
        const budgets = await Budget.find({
            user: ownerUserId,
            isActive: true,
            startDate: { $lte: today }, // Budget must have started
            $or: [
                { endDate: { $gte: today } }, // Ends in the future
                { endDate: null },             // Or has no end date (ongoing)
                { endDate: undefined }         // Also consider undefined for ongoing
            ]
        })
        .populate('category', 'name type icon color')
        .sort('-startDate')
        .exec() as IBudgetSchema[];
        return budgets;
    }

    // --- Admin Methods (optional, could be separate service or integrated) ---

    async createAdmin(data: CreateBudgetAdminDto): Promise<IBudgetSchema> {
        let userId: Types.ObjectId;
        let categoryId: Types.ObjectId;

        try {
            userId = new Types.ObjectId(data.user);
            categoryId = new Types.ObjectId(data.category);
        } catch (e) {
            throw new BadRequestError("Invalid user or category ID format.");
        }

        // Validate user and category exist
        const userExists = await User.findById(userId);
        if (!userExists) {
            throw new NotFoundError(`User not found with id ${data.user}`);
        }
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            throw new NotFoundError(`Category not found with id ${data.category}`);
        }

        if (data.period === 'custom' && !data.endDate) {
            throw new BadRequestError('End date is required for custom budget periods.');
        }

        const budgetData: Partial<IBudgetSchema> = {
            user: userId,
            category: categoryId,
            amount: data.amount,
            period: data.period,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : undefined,
        };

        const budget = new Budget(budgetData);
        await budget.save();
        await budget.populate('category', 'name type icon color');
        await budget.populate('user', 'username email firstName lastName');
        return budget;
    }

    async updateAdmin(id: string, data: UpdateBudgetAdminDto): Promise<IBudgetSchema> {
        const budget : IBudgetSchema = await this.findById(id, null); // Find without user filter

        // Validate category if changed
        if (data.category) {
            let categoryId: Types.ObjectId;
            try { categoryId = new Types.ObjectId(data.category); } catch (e) { throw new BadRequestError("Invalid category ID format."); }
            const categoryExists = await Category.findById(categoryId);
            if (!categoryExists) throw new NotFoundError(`Category not found with id ${data.category}`);
            budget.category = categoryId;
        }

        // Validate user if changed
        if (data.user) {
            let userId: Types.ObjectId;
            try { userId = new Types.ObjectId(data.user); } catch (e) { throw new BadRequestError("Invalid user ID format."); }
            const userExists = await User.findById(userId);
            if (!userExists) throw new NotFoundError(`User not found with id ${data.user}`);
            budget.user = userId as any;
        }

        // Validate end date if period is custom
        const newPeriod = data.period || budget.period;
        let newEndDate = data.endDate ? new Date(data.endDate) : budget.endDate;
        if (newPeriod === 'custom' && !newEndDate) throw new BadRequestError('End date is required for custom budget periods.');

        // Update fields selectively
        if (data.amount !== undefined) budget.amount = data.amount;
        if (data.period !== undefined) budget.period = data.period;
        if (data.startDate !== undefined) budget.startDate = new Date(data.startDate);
        
        if (data.endDate === null || data.endDate === undefined) {
            budget.endDate = data.endDate as any;
        } else if (data.endDate) {
            budget.endDate = new Date(data.endDate);
        }

        await budget.save();
        await budget.populate('category', 'name type icon color');
        await budget.populate('user', 'username email firstName lastName');
        return budget;
    }
}

export default BudgetService; 