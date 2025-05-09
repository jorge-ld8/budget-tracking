import { Types } from 'mongoose';
import Category from '../models/categories.ts';
import User from '../models/users.ts';
import { BadRequestError, NotFoundError } from '../errors/index.ts';
import type { IBaseService } from '../types/services/base.service.types.ts';
import type { ICategorySchema } from '../types/models/categories.types.ts';
import type { CreateCategoryDto, UpdateCategoryDto, CategoryQueryFiltersDto } from '../types/dtos/category.dto.ts';

class CategoryService implements IBaseService<ICategorySchema, CreateCategoryDto, UpdateCategoryDto, CategoryQueryFiltersDto> {
    async getAll(userId: string | null, filters: CategoryQueryFiltersDto = {}) {
        const queryObject: any = {};
        if (userId) {
            queryObject.user = userId;
        } else if (filters.user) { // For admin filtering by user
            queryObject.user = filters.user;
        }
        
        if (filters.type) {
            queryObject.type = filters.type;
        }
        
        if (filters.name) {
            queryObject.name = { $regex: filters.name, $options: 'i' };
        }
        
        // Handle deleted items
        if (!filters.includeDeleted) {
            queryObject.isDeleted = { $ne: true };
        }
        
        let query : any = Category.find(queryObject);
        
        // Sorting
        const sortBy = filters.sort ? filters.sort.split(',').join(' ') : 'name';
        query = query.sort(sortBy);
        
        // Field selection
        if (filters.fields) {
            const fieldsList = filters.fields.split(',').join(' ');
            query = query.select(fieldsList);
        }
        
        // Pagination
        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;
        const skip = (page - 1) * limit;
        
        query = query.skip(skip).limit(limit);
        
        const items = await query.populate(userId === null ? { path: 'user', select: 'username email' } : ''); // Populate user for admin
        const totalDocuments = await Category.countDocuments(queryObject);
        
        return { items, totalDocuments };
    }
    
    async findById(id: string, userId: string | null) {
        try {
            const categoryId = new Types.ObjectId(id);
            const queryFilter: any = { _id: categoryId, isDeleted: { $ne: true } };
            if (userId) {
                queryFilter.user = userId;
            }
            
            let query = Category.findOne(queryFilter);
            if (userId === null) { // Admin access, populate user
                query = query.populate({ path: 'user', select: 'username email' });
            }
            const category = await query;
            
            if (!category) {
                throw new NotFoundError(`Category not found with id ${id}${userId ? '' : ' (admin access)'}`);
            }
            
            return category;
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new BadRequestError(`Invalid category ID format or query error: ${id}. ${error.message}`);
        }
    }
    
    async create(userId: string, data: CreateCategoryDto): Promise<ICategorySchema> { // userId is the owner
        try {
            const ownerUserId = new Types.ObjectId(userId);
            // Validate user exists
            const userExists = await User.findById(ownerUserId);
            if (!userExists) {
                throw new NotFoundError(`User not found with id ${userId}`);
            }
            
            const categoryData = {
                ...data,
                user: ownerUserId
            };
            
            const category = new Category(categoryData);
            await category.save();
            
            return category;
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : String(error);
            throw new BadRequestError(`Failed to create category: ${message}`);
        }
    }
    
    async update(id: string, userId: string | null, data: UpdateCategoryDto): Promise<ICategorySchema> {
        try {
            const categoryId = new Types.ObjectId(id);
            const queryFilter: any = { _id: categoryId, isDeleted: { $ne: true } };
            if (userId) {
                queryFilter.user = userId; // User can only update their own
            }

            // For admin, if data includes 'user', it means reassigning.
            // If userId is null (admin) and data.user is provided, it implies potential user reassignment.
            // However, the base IBaseService update signature is (id, userId, data),
            // so user reassignment logic should be handled carefully, perhaps in a dedicated admin service method if complex.
            // For now, if userId is null, it just means admin can update any category.

            const category = await Category.findOneAndUpdate(
                queryFilter,
                data,
                { new: true, runValidators: true }
            );
            
            if (!category) {
                throw new NotFoundError(`Category not found with id ${id} or permission denied.`);
            }
            
            return category;
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : String(error);
            throw new BadRequestError(`Failed to update category: ${message}`);
        }
    }
    
    async delete(id: string, userId: string | null): Promise<Types.ObjectId> {
        try {
            const categoryId = new Types.ObjectId(id);
            const queryFilter: any = { _id: categoryId, isDeleted: { $ne: true } };
            if (userId) {
                queryFilter.user = userId;
            }
            
            const category = await Category.findOne(queryFilter);
            
            if (!category) {
                throw new NotFoundError(`Category not found with id ${id} or already deleted/permission denied.`);
            }
            
            await category.softDelete();
            return category._id; 
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : String(error);
            throw new BadRequestError(`Failed to delete category: ${message}`);
        }
    }
    
    async restore(id: string, userId: string | null): Promise<ICategorySchema> {
        try {
            const categoryId = new Types.ObjectId(id);
            const queryFilter: any = { _id: categoryId};
             if (userId) {
                queryFilter.user = userId;
            }
            
            let query : any = Category.findOne(queryFilter);
            query.includeDeleted = true;
            const category = await query;
            
            if (!category) {
                throw new NotFoundError(`Deleted category not found with id ${id} or permission denied.`);
            }
            
            await category.restore();
            let resultQuery = Category.findById(category._id);
            if (userId === null) { // Admin access, populate user
                resultQuery = resultQuery.populate({ path: 'user', select: 'username email' });
            }
            const restoredCategory = await resultQuery;
            if (!restoredCategory) { // Should not happen
                 throw new NotFoundError(`Restored category not found with id ${id}. This is unexpected.`);
            }
            return restoredCategory;
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : String(error);
            throw new BadRequestError(`Failed to restore category: ${message}`);
        }
    }
    
    async getByType(userId: string | null, type: string, filters: CategoryQueryFiltersDto = {}) {
        filters.type = type as CategoryQueryFiltersDto['type']; // Ensure type matches
        return this.getAll(userId, filters);
    }

    async getDeleted(userId: string | null): Promise<ICategorySchema[]> {
        const queryFilter: any = { isDeleted: true };
        if (userId) {
            queryFilter.user = userId;
        }
        let deletedCategories : ICategorySchema[] = await (Category as any).findDeleted(queryFilter).exec();

        return deletedCategories;
    }
}

export default CategoryService;
