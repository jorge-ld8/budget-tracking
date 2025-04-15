import { Category, ICategory } from '../models/categories';
import { NotFoundError, BadRequestError } from '../errors';
import { BaseController } from '../interfaces/BaseController';

class CategoriesController extends BaseController {
  constructor() {
    super();
  }

  async getAll(req, res) {
    const { type, name, sort, fields, page, limit, user } = req.query;

    const queryObject : any = {};
    
    // Only return categories that belong to the current user
    queryObject.user = req.user._id;
    
    if (type) {
      queryObject.type = type;
    }
    if (name) {
      queryObject.name = { $regex: name, $options: 'i' };
    }
    
    let result = Category.find(queryObject);

    if (sort) {
      const sortFields = sort.split(',').join(' ');
      result = result.sort(sortFields);
    } else {
      // Default sort by name
      result = result.sort('name');
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
    
    const categories = await result;
    res.status(200).json({ 
      categories, 
      nbHits: categories.length,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(await Category.countDocuments(queryObject) / limitNumber)
    });
  }

  async getById(req, res, next) {
    const { id } = req.params;
    
    const category = await Category.findOne({
      _id: id,
      user: req.user._id
    });
    
    if (!category) {
      return next(new NotFoundError('Category not found'));
    }
    
    res.status(200).json({ category });
  }

  async create(req, res) {
    // Ensure the category is associated with the current user
    const categoryData = {
      ...req.body,
      user: req.user._id
    };
    
    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({ category });
  }

  async update(req, res, next) {
    const { id } = req.params;
    const { name, type, icon, color } = req.body;
    
    const category = await Category.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { name, type, icon, color }, 
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return next(new NotFoundError('Category not found'));
    }
    
    res.status(200).json({ category });
  }

  async delete(req, res, next) {
    const { id } = req.params;
    
    const category = await Category.findOne({
      _id: id,
      user: req.user._id
    });
    
    if (!category) {
      return next(new NotFoundError('Category not found'));
    }
    
    if (category.isDeleted) {
      return next(new BadRequestError('Category is already deleted'));
    }
    
    await category.softDelete();
    res.status(200).json({ message: 'Category soft deleted successfully' });
  }
  
  async restore(req, res, next) {
    const { id } = req.params;
    
    // Set includeDeleted flag to allow finding deleted items
    const query : any = Category.findOne({
      _id: id,
      user: req.user._id
    });
    query.includeDeleted = true;
    
    const category = await query;

    if (!category) {
      return next(new NotFoundError('Category not found'));
    }
    
    if (!category.isDeleted) {
      return next(new BadRequestError('Category is not deleted'));
    }
    
    await category.restore();
    res.status(200).json({ message: 'Category restored successfully', category });
  }

  async getDeletedCategories(req, res) {
    const deletedCategories = await Category.findDeleted({
      user: req.user._id
    });
    
    res.status(200).json({ 
      deletedCategories,
      count: deletedCategories.length
    });
  }
  
  async getByType(req, res, next) {
    const { type } = req.params;
    
    if (!['income', 'expense'].includes(type)) {
      return next(new BadRequestError('Invalid category type. Must be income or expense'));
    }
    
    const categories = await Category.find({
      type,
      user: req.user._id
    }).sort('name');
    
    res.status(200).json({ 
      categories,
      count: categories.length
    });
  }
}

export { CategoriesController };