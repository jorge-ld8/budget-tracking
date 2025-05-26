import type { NextFunction, Response } from 'express';
import User from '../models/users.ts';
import { BadRequestError, NotFoundError } from '../errors/index.ts';
import type { AuthenticatedRequest } from '../types/index.d.ts';
import type { CreateUserDto, UpdateUserAdminDto, UpdateUserDto, UserQueryFiltersDto } from '../types/dtos/user.dto.ts';
import type { IUser } from '../types/models/user.types.ts';
import { type Query, Types } from 'mongoose';

class UsersController {
    constructor() {}

    // Helper to build query object
    private buildBaseQuery(filters: UserQueryFiltersDto) {
        const queryObject: any = {};

        if (filters.currency) {
            queryObject.currency = filters.currency;
        }

        if (filters.name) {
            queryObject.$or = [
                { username: { $regex: filters.name, $options: 'i' } },
                { email: { $regex: filters.name, $options: 'i' } },
                { firstName: { $regex: filters.name, $options: 'i' } },
                { lastName: { $regex: filters.name, $options: 'i' } }
            ];
        }

        if (filters.numericFilters) {
            const operatorMap: Record<string, string> = {
                '>': '$gt',
                '>=': '$gte',
                '<': '$lt',
                '<=': '$lte',
                '=': '$eq',
                '!=': '$ne'
            };
            const regex = /\b(<|>|>=|<=|=|!=)\b/g;
            const processedFilters = filters.numericFilters.replace(regex, (match) => `-${operatorMap[match]}-`);
            const options = ['balance', 'age'];
            processedFilters.split(',').forEach((item) => {
                const [field, operator, value] = item.split('-');
                if (options.includes(field)) {
                    queryObject[field] = { [operator]: Number(value) };
                }
            });
        }

        return queryObject;
    }

    async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }

            const filters: UserQueryFiltersDto = req.query;
            const queryObject = this.buildBaseQuery(filters);

            let result : Query<IUser[], IUser> = User.find(queryObject);

            // Apply sorting
            if (filters.sort) {
                const sortFields = filters.sort.split(',').join(' ');
                result = result.sort(sortFields);
            } else {
                result = result.sort('username');
            }

            // Apply field selection
            if (filters.fields) {
                const fieldsList = filters.fields.split(',').join(' ');
                result = result.select(fieldsList);
            }

            // Pagination
            const pageNumber = Number(filters.page) || 1;
            const limitNumber = Number(filters.limit) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            result = result.skip(skip).limit(limitNumber);

            const [users, totalDocuments] = await Promise.all([
                result.exec(),
                User.countDocuments(queryObject)
            ]);

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

    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }

            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                throw new NotFoundError('User not found');
            }
            res.status(200).json({ user });
        } catch (error) {
            next(error);
        }
    }

    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }

            const userData: CreateUserDto = req.body;

            // Basic validation
            if (!userData.username || !userData.email || !userData.password || !userData.firstName || !userData.lastName) {
                throw new BadRequestError('Missing required fields: username, email, password, firstName, lastName');
            }

            const user = new User({ ...userData });
            await user.save();

            res.status(201).json({ user });
        } catch (error) {
            if ((error as any).code === 11000) {
                return next(new BadRequestError('Username or email already exists'));
            }
            next(error);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }

            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            if (user.isDeleted) {
                throw new BadRequestError('User is already deleted');
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

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }

            const { id } = req.params;
            const updateData: UpdateUserDto = req.body;

            if (Object.keys(updateData).length === 0) {
                throw new BadRequestError('No update data provided.');
            }

            const user = await User.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true
            });

            if (!user) {
                throw new NotFoundError('User not found');
            }

            res.status(200).json({ user });
        } catch (error) {
            if ((error as any).code === 11000) {
                return next(new BadRequestError('Username or email already exists'));
            }
            next(error);
        }
    }

    async restore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }

            const { id } = req.params;

            // Set includeDeleted flag to allow finding deleted items
            const query: any = User.findById(id);
            query.includeDeleted = true;

            const user = await query;
            if (!user) {
                throw new NotFoundError('User not found');
            }

            if (!user.isDeleted) {
                throw new BadRequestError('User is not deleted');
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

    async getDeleted(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                throw new BadRequestError('User authentication information is missing.');
            }

            const deletedUsers = await User.findDeleted({});
            res.status(200).json({
                deletedUsers,
                count: deletedUsers.length
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== Admin-only methods ====================

    async getAllAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const filters: UserQueryFiltersDto = req.query;
            const queryObject = this.buildBaseQuery(filters);

            let result : Query<IUser[], IUser> = User.find(queryObject);

            // Apply sorting
            if (filters.sort) {
                const sortFields = filters.sort.split(',').join(' ');
                result = result.sort(sortFields);
            } else {
                result = result.sort('username');
            }

            // Apply field selection
            if (filters.fields) {
                const fieldsList = filters.fields.split(',').join(' ');
                result = result.select(fieldsList);
            }

            // Pagination
            const pageNumber = Number(filters.page) || 1;
            const limitNumber = Number(filters.limit) || 50;
            const skip = (pageNumber - 1) * limitNumber;

            result = result.skip(skip).limit(limitNumber);

            const [users, totalDocuments] = await Promise.all([
                result.exec(),
                User.countDocuments(queryObject)
            ]);

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

    async getByIdAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);

            if (!user) {
                throw new NotFoundError('User not found');
            }

            res.status(200).json({ user });
        } catch (error) {
            next(error);
        }
    }

    async createAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userData: CreateUserDto = req.body;

            // Basic validation
            if (!userData.username || !userData.email || !userData.password || !userData.firstName || !userData.lastName) {
                throw new BadRequestError('Missing required fields: username, email, password, firstName, lastName');
            }

            const user = new User({ ...userData });
            await user.save();

            res.status(201).json({ user });
        } catch (error) {
            if ((error as any).code === 11000) {
                return next(new BadRequestError('Username or email already exists'));
            }
            next(error);
        }
    }

    async updateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updateData: UpdateUserAdminDto = req.body;

            if (Object.keys(updateData).length === 0) {
                throw new BadRequestError('No update data provided.');
            }

            const user = await User.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true
            });

            if (!user) {
                throw new NotFoundError('User not found');
            }

            res.status(200).json({ user });
        } catch (error) {
            if ((error as any).code === 11000) {
                return next(new BadRequestError('Username or email already exists'));
            }
            next(error);
        }
    }

    async deleteAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);

            if (!user) {
                throw new NotFoundError('User not found');
            }

            if (user.isDeleted) {
                throw new BadRequestError('User is already deleted');
            }

            await user.softDelete();
            res.status(200).json({
                message: 'User soft deleted successfully by admin',
                userId: user._id
            });
        } catch (error) {
            next(error);
        }
    }

    async restoreAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Set includeDeleted flag to allow finding deleted items
            const query: any = User.findById(id);
            query.includeDeleted = true;

            const user = await query;
            if (!user) {
                throw new NotFoundError('User not found');
            }

            if (!user.isDeleted) {
                throw new BadRequestError('User is not deleted');
            }

            await user.restore();
            res.status(200).json({
                message: 'User restored successfully by admin',
                user
            });
        } catch (error) {
            next(error);
        }
    }

    async getDeletedUsersAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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