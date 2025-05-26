import type { NextFunction, Response } from 'express';
import { BadRequestError } from '../errors/index.ts';
import type { AuthenticatedRequest } from '../types/index.d.ts';
import type { CategoryController as ICategoryController } from '../types/controllers.ts';
import type { CategoryQueryFiltersDto, CreateCategoryDto, UpdateCategoryDto } from '../types/dtos/category.dto.ts';
import CategoryService from '../services/CategoryService.ts';

class CategoriesController implements ICategoryController {
  private readonly categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?._id?.toString() || null;
      const filters : CategoryQueryFiltersDto = req.query;

      const { items: categories, totalDocuments } = await this.categoryService.getAll(userId, filters);
      
      const pageNumber = Number(filters.page) || 1;
      const limitNumber = Number(filters.limit) || (userId === null ? 50 : 10); // Match service defaults

      res.status(200).json({
        categories,
        count: categories.length,
        page: pageNumber,
        limit: limitNumber,
        totalPagepros: Math.ceil(totalDocuments / limitNumber),
        total: totalDocuments,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      const category = await this.categoryService.findById(id, userId);
      res.status(200).json({ category });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id.toString();
      const categoryData: CreateCategoryDto = req.body;
      const category = await this.categoryService.create(userId, categoryData);
      res.status(201).json({ category });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      const categoryData: UpdateCategoryDto = req.body;
      const category = await this.categoryService.update(id, userId, categoryData);
      res.status(200).json({ category });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      const deletedCategoryId = await this.categoryService.delete(id, userId);
      res.status(200).json({ message: 'Category soft deleted successfully', categoryId: deletedCategoryId.toHexString() });
    } catch (error) {
      next(error);
    }
  }
  
  async restore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      const category = await this.categoryService.restore(id, userId);
      res.status(200).json({ message: 'Category restored successfully', category });
    } catch (error) {
      next(error);
    }
  }

  async getDeleted(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id.toString();
      const deletedCategories = await this.categoryService.getDeleted(userId);
      res.status(200).json({ 
        deletedCategories,
        count: deletedCategories.length
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getByType(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const userId = req.user._id.toString();
      const filters = req.query as CategoryQueryFiltersDto;

      const { items: categories, totalDocuments } = await this.categoryService.getByType(userId, type, filters);
      
      const page = Number(filters.page) || 1;
      const limit = Number(filters.limit) || (userId === null ? 50 : 10); // Match service defaults
      
      res.status(200).json({ 
        categories,
        count: categories.length,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
        total: totalDocuments
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Admin Methods ---
  // Assuming isAdmin middleware protects these routes

  async getAllAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = req.query as CategoryQueryFiltersDto;
      
      // For admin, pass null as current userId, service uses filters.user if provided
      const { items: categories, totalDocuments } = await this.categoryService.getAll(null, filters);
      
      const page = Number(filters.page) || 1;
      const limit = Number(filters.limit) || 50; // Admin default limit

      res.status(200).json({ 
        categories, 
        count: categories.length,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
        total: totalDocuments
      });
    } catch (error) {
      next(error);
    }
  }

  async getByIdAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      // Admin passes null for userId to service.findById
      const category = await this.categoryService.findById(id, null);
      res.status(200).json({ category });
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categoryData: CreateCategoryDto = req.body;
      // Admin MUST provide 'user' field in req.body for CreateCategoryDto
      if (!req.body.user) {
        throw new BadRequestError('User ID must be provided in the request body for admin creation.');
      }
      // The service's create method takes the owner's userId as the first argument.
      const category = await this.categoryService.create(req.body.user, categoryData);
      res.status(201).json({ category });
    } catch (error) {
      next(error);
    }
  }

  async updateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const categoryData: UpdateCategoryDto & { user?: string } = req.body; 
      // Admin passes null for userId, service.update handles updates based on ID only for admin.
      // If categoryData includes 'user', it means user reassignment is intended.
      // The service's update method logic for userId=null allows updating any category.
      // If categoryData.user is present, it will be part of the update payload.
      const category = await this.categoryService.update(id, null, categoryData);
      res.status(200).json({ category });
    } catch (error) {
      next(error);
    }
  }

  async deleteAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      // Admin passes null for userId to service.delete
      const deletedCategoryId = await this.categoryService.delete(id, null);
      res.status(200).json({ 
        message: 'Category soft deleted successfully by admin',
        categoryId: deletedCategoryId.toHexString()
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      // Admin passes null for userId to service.restore
      const category = await this.categoryService.restore(id, null);
      res.status(200).json({ 
        message: 'Category restored successfully by admin', 
        category 
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeletedAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deletedCategories = await this.categoryService.getDeleted(null); // Pass null for admin
      res.status(200).json({
        deletedCategories,
        count: deletedCategories.length
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CategoriesController;