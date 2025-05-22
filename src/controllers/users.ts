import IUser from '../models/users.ts';
import User from '../models/users.ts';
import { NotFoundError, BadRequestError } from '../errors/index.ts';
import { BaseController } from '../interfaces/BaseController.ts';

class UsersController extends BaseController {
  constructor() {
    super();
  }

  async getAll(req, res) {
    const { currency, name, sort, fields, page, limit, numericFilters } = req.query;

    const queryObject: any = {};
    if (currency) {
      queryObject.currency = currency;
    }
    if (name) {
      queryObject.$or = [
        { username: { $regex: name, $options: 'i' } },
        { email: { $regex: name, $options: 'i' } },
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } }
      ];
    }
    if (numericFilters) {
      console.log(numericFilters);
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
      const options = ['balance', 'age'];
      filters = filters.split(',').forEach((item) => {
        const [field, operator, value] = item.split('-');
        if (options.includes(field)) {
          queryObject[field] = { [operator]: Number(value) };
        }
      });
    }
    let result : any= User.find(queryObject);

    if (sort) {
      const sortFields = sort.split(',').join(' ');
      result = result.sort(sortFields);
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
    
    const users = await result;
    res.status(200).json({ 
      users, 
      nbHits: users.length,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(await User.countDocuments(queryObject) / limitNumber)
    });
  }

  async getById(req, res, next) {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    res.status(200).json({ user });
  }

  async create(req, res) {
    const user = new User({...req.body});
    await user.save();

    // Send a success response
    res.status(201).json({ user });
  }

  async delete(req, res, next) {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    if (user.isDeleted) {
      return next(new BadRequestError('User is already deleted'));
    }
    
    await user.softDelete();
    res.status(200).json({ message: 'User soft deleted successfully' });
  }

  async update(req, res, next) {
    const { id } = req.params;
    
    const user = await User.findByIdAndUpdate(id, req.body, 
      { new: true , runValidators: true });
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    res.status(200).json({ user });
  }
  
  async restore(req, res, next) {
    // Set includeDeleted flag to allow finding deleted items
    const query : any = User.findById(req.params.id);
    query.includeDeleted = true;
    
    const user = await query;
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    if (!user.isDeleted) {
      return next(new BadRequestError('User is not deleted'));
    }
    
    await user.restore();
    res.status(200).json({ message: 'User restored successfully', user });
  }

  async getDeletedUsers(req, res) {
    const deletedUsers = await User.findDeleted({});
    res.status(200).json({ 
      deletedUsers,
      count: deletedUsers.length
    });
  }

  async getAllAdmin(req, res, next) {
    try {
      const { currency, name, sort, fields, page, limit, numericFilters, includeDeleted } = req.query;

      const queryObject: any = {};
      
      if (currency) {
        queryObject.currency = currency;
      }
      
      if (name) {
        queryObject.$or = [
          { username: { $regex: name, $options: 'i' } },
          { email: { $regex: name, $options: 'i' } },
          { firstName: { $regex: name, $options: 'i' } },
          { lastName: { $regex: name, $options: 'i' } }
        ];
      }
      
      // Numeric filters for fields like balance or age
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
        const options = ['balance', 'age'];
        filters.split(',').forEach((item) => {
          const [field, operator, value] = item.split('-');
          if (options.includes(field)) {
            queryObject[field] = { [operator]: Number(value) };
          }
        });
      }
      
      // Set up query
      let result : any = User.find(queryObject);
      
      // Sort options
      if (sort) {
        const sortFields = sort.split(',').join(' ');
        result = result.sort(sortFields);
      } else {
        // Default sort by username
        result = result.sort('username');
      }
      
      // Field selection
      if (fields) {
        const fieldsList = fields.split(',').join(' ');
        result = result.select(fieldsList);
      }
      
      // Pagination
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;
      
      result = result.skip(skip).limit(limitNumber);
      
      // Execute query
      const users = await result;
      const totalDocuments = await User.countDocuments(queryObject);
      
      res.status(200).json({ 
        users, 
        count: users.length,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalDocuments / limitNumber),
        total: totalDocuments
      });
    } catch (error) {
      next(error);
    }
  }

  async getByIdAdmin(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);
      
      if (!user) {
        return next(new NotFoundError('User not found'));
      }
      
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req, res, next) {
    try {
      // Create the user with all provided fields
      const user = new User({...req.body});
      await user.save();
      
      // Send a success response
      res.status(201).json({ user });
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error (likely username or email)
        return next(new BadRequestError('Username or email already exists'));
      }
      next(error);
    }
  }

  async updateAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { username, email, firstName, lastName, currency, isAdmin, isActive } = req.body;
      
      // Build update object with only provided fields
      const updateData: any = {};
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (currency !== undefined) updateData.currency = currency;
      if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!user) {
        return next(new NotFoundError('User not found'));
      }
      
      res.status(200).json({ user });
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error (likely username or email)
        return next(new BadRequestError('Username or email already exists'));
      }
      next(error);
    }
  }

  async deleteAdmin(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);
      
      if (!user) {
        return next(new NotFoundError('User not found'));
      }
      
      if (user.isDeleted) {
        return next(new BadRequestError('User is already deleted'));
      }
      
      await user.softDelete();
      res.status(200).json({ 
        message: 'User soft deleted successfully',
        userId: user._id
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreAdmin(req, res, next) {
    try {
      const { id } = req.params;
      
      // Set includeDeleted flag to allow finding deleted items
      const query: any = User.findById(id);
      query.includeDeleted = true;
      
      const user = await query;
      
      if (!user) {
        return next(new NotFoundError('User not found'));
      }
      
      if (!user.isDeleted) {
        return next(new BadRequestError('User is not deleted'));
      }
      
      await user.restore();
      res.status(200).json({ 
        message: 'User restored successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeletedUsersAdmin(req, res, next) {
    try {
      const deletedUsers = await User.findDeleted({});
      
      res.status(200).json({ 
        deletedUsers,
        count: deletedUsers.length
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UsersController;