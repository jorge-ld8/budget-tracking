import mongoose from 'mongoose';
import Account from '../models/accounts.ts';
import User from '../models/users.ts'; // Assuming user model path
import { NotFoundError, BadRequestError } from '../errors/index.ts';
import type { IAccountSchema, IAccountModel } from '../types/models/accounts.types.ts'; // Assuming types path
import type { AccountQueryFiltersDto, CreateAccountDto, UpdateAccountDto, UpdateBalanceDto } from '../types/dtos/account.dto.ts';


class AccountService {

    // Helper to build the base query object for find operations
    private buildQueryObject(userId: string | null, filters: AccountQueryFiltersDto): any {
        const queryObject: any = {};

        // If userId is provided, filter by user (standard user operation)
        // If userId is null, don't filter by user (admin operation)
        queryObject.user = userId;

        if (filters.type) {
            queryObject.type = filters.type;
        }
        if (filters.name) {
            queryObject.$or = [
                { name: { $regex: filters.name, $options: 'i' } },
                { description: { $regex: filters.name, $options: 'i' } }
            ];
        }
        if (filters.numericFilters) {
            const operatorMap: { [key: string]: string } = {
                '>': '$gt', '>=': '$gte', '<': '$lt', '<=': '$lte', '=': '$eq', '!=': '$ne'
            };
            const regex = /\b(<|>|>=|<=|=|!=)\b/g;
            let numFilters = filters.numericFilters.replace(regex, (match) => `-${operatorMap[match]}-`);
            const allowedNumericFields = ['balance']; // Only allow filtering on balance
            numFilters.split(',').forEach((item) => {
                const [field, operator, value] = item.split('-');
                if (allowedNumericFields.includes(field)) {
                    queryObject[field] = { [operator]: Number(value) };
                }
            });
        }
        return queryObject;
    }

    async getAll(userId: string | null, filters: AccountQueryFiltersDto): Promise<{ accounts: IAccountSchema[], totalDocuments: number }> {
        const queryObject = this.buildQueryObject(userId, filters);
        let query : any = Account.find(queryObject);

        // Sorting
        if (filters.sort) {
            const sortFields = filters.sort.split(',').join(' ');
            query = query.sort(sortFields);
        } else if (!userId) { // Default sort for admin view if not specified
             query = query.sort('-createdAt');
        }


        // Field selection
        if (filters.fields) {
            const fieldsList = filters.fields.split(',').join(' ');
            query = query.select(fieldsList);
        }

        // Pagination
        const pageNumber = Number(filters.page) || 1;
        const limitNumber = Number(filters.limit) || (userId ? 10 : 50); // Default limit 10 for users, 50 for admin
        const skip = (pageNumber - 1) * limitNumber;
        query = query.skip(skip).limit(limitNumber);

        // Populate user for admin queries
        if (!userId) {
            query = query.populate('user', 'username email firstName lastName');
        }

        const accounts = await query;
        const totalDocuments = await Account.countDocuments(queryObject);

        return { accounts, totalDocuments };
    }

    async findById(accountId: string, userId: string | null): Promise<IAccountSchema> {
        const query: any = { _id: accountId };
        if (userId) {
            query.user = userId; // Filter by user if userId is provided
        }

        let accountQuery = Account.findOne(query);

        // Populate user for admin queries
        if (!userId) {
            accountQuery = accountQuery.populate('user', 'username email firstName lastName');
        }

        const account = await accountQuery;

        if (!account) {
            throw new NotFoundError(`Account not found with id ${accountId}${userId ? ` for the current user` : ''}`);
        }
        return account;
    }

    async create(userId: string, data: CreateAccountDto): Promise<IAccountSchema> {
        const accountData: Partial<IAccountSchema> = {
            ...data,
            user: new mongoose.Types.ObjectId(userId),
            balance: 0, 
            isActive: data.isActive !== undefined ? data.isActive : true,
        };
        const account = new Account(accountData);
        await account.save();
        return account;
    }

    async createAdmin(data: CreateAccountDto & { balance?: number }): Promise<IAccountSchema> {
         if (!data.user) {
            throw new BadRequestError('User ID is required for admin creation');
         }
         // Check if user exists
         const userExists = await User.findById(data.user);
         if (!userExists) {
            throw new NotFoundError(`User not found with id ${data.user}`);
         }

        const accountData: Partial<IAccountSchema> = {
            ...data,
            user: new mongoose.Types.ObjectId(data.user),
            balance: data.balance || 0, 
            isActive: data.isActive !== undefined ? data.isActive : true,
        };

        const account = new Account(accountData);
        await account.save();
        // Optionally populate user info on return for admin context
        // await account.populate('user', 'username email firstName lastName');
        return account;
    }


    async update(accountId: string, userId: string, data: UpdateAccountDto): Promise<IAccountSchema> {

      const account = await Account.findOneAndUpdate(
            { _id: accountId, user: userId },
            data,
            { new: true, runValidators: true }
        );

        if (!account) {
            throw new NotFoundError(`Account not found with id ${accountId} for the current user`);
        }
        return account;
    }

     async updateAdmin(accountId: string, data: UpdateAccountDto): Promise<IAccountSchema> {
        // Allow updating balance and user for admin
        const updateData: any = {};
         if (data.name !== undefined) updateData.name = data.name;
         if (data.type !== undefined) updateData.type = data.type;
         if (data.description !== undefined) updateData.description = data.description;
         if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const account = await Account.findByIdAndUpdate(
            accountId,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'username email firstName lastName'); // Populate user info

        if (!account) {
            throw new NotFoundError(`Account not found with id ${accountId}`);
        }
        return account;
    }

    async delete(accountId: string, userId: string | null): Promise<mongoose.Types.ObjectId> {
        // If userId is null, it's an admin delete, otherwise user delete
        const query = userId ? { _id: accountId, user: userId } : { _id: accountId };
        const account = await Account.findOne(query);

        if (!account) {
             throw new NotFoundError(`Account not found with id ${accountId}${userId ? ` for the current user` : ''}`);
        }
        if (account.isDeleted) {
            throw new BadRequestError('Account is already deleted');
        }

        await account.softDelete();
        return account._id;
    }

    async restore(accountId: string, userId: string | null): Promise<IAccountSchema> {
        const queryFilter = userId ? { _id: new mongoose.Types.ObjectId(accountId), user: new mongoose.Types.ObjectId(userId) } : { _id: new mongoose.Types.ObjectId(accountId) };

        // Use the static method to find deleted, respecting potential user filter
        const account : any = (await Account.findDeleted(queryFilter)).findOne();

        if (!account) {
            throw new NotFoundError(`Deleted account not found with id ${accountId}${userId ? ` for the current user` : ''}`);
        }

        // Restore method handles setting isDeleted to false and saving
        await account.restore();
        return account;
    }

    async updateBalance(accountId: string, userId: string, data: UpdateBalanceDto): Promise<IAccountSchema> {
        const account = await this.findById(accountId, userId); // Reuse findById to check ownership and existence

        if (account.isDeleted) {
            throw new BadRequestError('Cannot update balance of a deleted account');
        }

        const amount = Number(data.amount);
        if (isNaN(amount) || amount < 0) {
             throw new BadRequestError('Invalid amount provided');
        }


        if (data.operation === 'add') {
            account.balance += amount;
        } else if (data.operation === 'subtract') {
            if (account.balance < amount) {
                throw new BadRequestError('Insufficient funds');
            }
            account.balance -= amount;
        } else {
             throw new BadRequestError('Invalid operation type specified. Use "add" or "subtract".');
        }

        await account.save();
        return account; // Return the updated account document
    }

    async toggleActive(accountId: string, userId: string): Promise<IAccountSchema> {
        const account : IAccountSchema = await this.findById(accountId, userId); // Check ownership and existence

        if (account.isDeleted) {
            throw new BadRequestError('Cannot change active status of a deleted account');
        }

        account.isActive = !account.isActive;
        await account.save();
        return account;
    }

    async getDeleted(userId: string | null): Promise<IAccountSchema[]> {
         const query = userId ? { user: new mongoose.Types.ObjectId(userId) } : {}; // Filter by user if userId provided
         const deletedAccounts : any = await Account.findDeleted(query);
         return deletedAccounts;
    }
}

export default AccountService; // Export a singleton instance