import mongoose, { Query, Types } from 'mongoose';
import User from '../models/users.ts';
import type { IUser } from '../types/models/user.types.ts';
import type { IBaseService } from '../types/services/base.service.types.ts';
import type { UserQueryFiltersDto, CreateUserDto, UpdateUserDto, UpdateUserAdminDto } from '../types/dtos/user.dto.ts';
import { BadRequestError, NotFoundError } from '../errors/index.ts';

class UserService implements IBaseService<IUser, CreateUserDto, UpdateUserDto, UserQueryFiltersDto> {

    // Helper to build the base query object for find operations
    private buildBaseQuery(userId: string | null, filters: UserQueryFiltersDto) {
        let query: any = {};

        // If userId is provided (non-admin), filter by user
        if (userId) {
            query.user = new Types.ObjectId(userId);
        }

        // Apply filters from DTO
        if (filters.currency) {
            query.currency = filters.currency;
        }

        if (filters.name) {
            query.$or = [
                { username: { $regex: filters.name, $options: 'i' } },
                { email: { $regex: filters.name, $options: 'i' } },
                { firstName: { $regex: filters.name, $options: 'i' } },
                { lastName: { $regex: filters.name, $options: 'i' } }
            ];
        }

        // Handle numeric filters
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
            let processedFilters = filters.numericFilters.replace(regex, (match) => `-${operatorMap[match]}-`);
            const options = ['balance', 'age'];
            processedFilters.split(',').forEach((item) => {
                const [field, operator, value] = item.split('-');
                if (options.includes(field)) {
                    query[field] = { [operator]: Number(value) };
                }
            });
        }

        return query;
    }

    async getAll(userId: string | null, filters: UserQueryFiltersDto): Promise<{ items: IUser[], totalDocuments: number }> {
        const query = this.buildBaseQuery(userId, filters);

        // Build the query
        let userQuery : Query<IUser[], IUser> = User.find(query);

        // Apply sorting
        if (filters.sort) {
            const sortFields = filters.sort.split(',').join(' ');
            userQuery = userQuery.sort(sortFields);
        } else {
            userQuery = userQuery.sort('username');
        }

        // Apply field selection
        if (filters.fields) {
            const fieldsList = filters.fields.split(',').join(' ');
            userQuery = userQuery.select(fieldsList);
        }

        // Apply pagination
        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || (userId === null ? 50 : 10);
        const skip = (page - 1) * limit;

        userQuery = userQuery.skip(skip).limit(limit);

        const [items, totalDocuments] = await Promise.all([
            userQuery.exec(),
            User.countDocuments(query)
        ]);

        return { items: items as IUser[], totalDocuments };
    }

    async findById(id: string, userId: string | null): Promise<IUser> {
        try {
            const objectId = new Types.ObjectId(id);
            let query: any = { _id: objectId };

            // If not admin, ensure user can only access their own data
            if (userId) {
                query.user = new Types.ObjectId(userId);
            }

            const user = await User.findOne(query);
            if (!user) {
                throw new NotFoundError('User not found or access denied.');
            }

            return user;
        } catch (error: any) {
            if (error instanceof NotFoundError) throw error;
            throw new BadRequestError("Invalid user ID format or access error.");
        }
    }

    async create(userId: string, data: CreateUserDto): Promise<IUser> {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({ $or: [{ email: data.email }, { username: data.username }] });
            if (existingUser) {
                throw new BadRequestError('User with this email or username already exists');
            }

            const userDoc = new User({
                ...data,
                currency: data.currency || 'USD'
            });

            const savedUser = await userDoc.save();
            return savedUser;
        } catch (error: any) {
            if (error instanceof BadRequestError) throw error;
            if (error.code === 11000) {
                throw new BadRequestError('Username or email already exists');
            }
            throw new BadRequestError(`Error creating user: ${error.message}`);
        }
    }

    async update(id: string, userId: string, data: UpdateUserDto): Promise<IUser> {
        try {
            const objectId = new Types.ObjectId(id);
            let query: any = { _id: objectId };

            // If not admin, ensure user can only update their own data
            if (userId) {
                query.user = new Types.ObjectId(userId);
            }

            const updatedUser = await User.findOneAndUpdate(
                query,
                { $set: data },
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                throw new NotFoundError('User not found or access denied.');
            }

            return updatedUser;
        } catch (error: any) {
            if (error instanceof NotFoundError) throw error;
            if (error.code === 11000) {
                throw new BadRequestError('Username or email already exists');
            }
            throw new BadRequestError("Invalid user ID format or update error.");
        }
    }

    async delete(id: string, userId: string | null): Promise<Types.ObjectId> {
        try {
            const objectId = new Types.ObjectId(id);
            let query: any = { _id: objectId };

            // If not admin, ensure user can only delete their own data
            if (userId) {
                query.user = new Types.ObjectId(userId);
            }

            const user = await User.findOne(query);
            if (!user) {
                throw new NotFoundError('User not found or access denied.');
            }

            if (user.isDeleted) {
                throw new BadRequestError('User is already deleted');
            }

            await user.softDelete();
            return user._id;
        } catch (error: any) {
            if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
            throw new BadRequestError("Invalid user ID format or deletion error.");
        }
    }

    async restore(id: string, userId: string | null): Promise<IUser> {
        try {
            const objectId = new Types.ObjectId(id);
            let query: any = { _id: objectId };

            // If not admin, ensure user can only restore their own data
            if (userId) {
                query.user = new Types.ObjectId(userId);
            }

            // Set includeDeleted flag to allow finding deleted items
            const userQuery = User.findOne(query) as any;
            userQuery.includeDeleted = true;

            const user = await userQuery;
            if (!user) {
                throw new NotFoundError('User not found or access denied.');
            }

            if (!user.isDeleted) {
                throw new BadRequestError('User is not deleted');
            }

            await user.restore();
            return user;
        } catch (error: any) {
            if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
            throw new BadRequestError("Invalid user ID format or restoration error.");
        }
    }

    async getDeleted(userId: string | null): Promise<IUser[]> {
        try {
            let query: any = {};

            // If not admin, filter by user
            if (userId) {
                query.user = new Types.ObjectId(userId);
            }

            const deletedUsers = await User.findDeleted(query) as unknown as IUser[];
            
            return deletedUsers;
        } catch (error: any) {
            throw new BadRequestError(`Error fetching deleted users: ${error.message}`);
        }
    }

    // Admin-specific methods
    async createAdmin(data: CreateUserDto): Promise<IUser> {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({ $or: [{ email: data.email }, { username: data.username }] });
            if (existingUser) {
                throw new BadRequestError('User with this email or username already exists');
            }

            const userDoc = new User({
                ...data,
                currency: data.currency || 'USD'
            });

            const savedUser = await userDoc.save();
            return savedUser;
        } catch (error: any) {
            if (error instanceof BadRequestError) throw error;
            if (error.code === 11000) {
                throw new BadRequestError('Username or email already exists');
            }
            throw new BadRequestError(`Error creating user: ${error.message}`);
        }
    }

    async updateAdmin(id: string, data: UpdateUserAdminDto): Promise<IUser> {
        try {
            const objectId = new Types.ObjectId(id);

            const updatedUser = await User.findByIdAndUpdate(
                objectId,
                { $set: data },
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                throw new NotFoundError('User not found.');
            }

            return updatedUser;
        } catch (error: any) {
            if (error instanceof NotFoundError) throw error;
            if (error.code === 11000) {
                throw new BadRequestError('Username or email already exists');
            }
            throw new BadRequestError("Invalid user ID format or update error.");
        }
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                throw new BadRequestError('Current password is incorrect');
            }

            // Update password
            user.password = newPassword;
            await user.save();
        } catch (error: any) {
            if (error instanceof NotFoundError || error instanceof BadRequestError) throw error;
            throw new BadRequestError("Error changing password.");
        }
    }
}

export default UserService; 