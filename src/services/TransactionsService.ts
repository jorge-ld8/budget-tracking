import mongoose, { Types } from 'mongoose';
import Transaction from '../models/transactions.ts';
import Account from '../models/accounts.ts';
import User from '../models/users.ts';
import { NotFoundError, BadRequestError } from '../errors/index.ts';
import type { ITransactionSchema } from '../types/models/transaction.types.ts';
import type { TransactionQueryFiltersDto, CreateTransactionDto, UpdateTransactionDto, CreateTransactionAdminDto, UpdateTransactionAdminDto } from '../types/dtos/transaction.dto.ts';
import s3Client from '../config/s3Config.js'; // Import S3 client
import env from '../config/env.js';         // Import env config for bucket name
import { DeleteObjectCommand } from '@aws-sdk/client-s3'; // Import S3 command

class TransactionService {

    // Helper to build the base query object for find operations
    private buildQueryObject(userId: string | null, filters: TransactionQueryFiltersDto): any {
        const queryObject: any = {};

        if (userId) {
            // Convert string userId to ObjectId for querying
            try {
                 queryObject.user = new Types.ObjectId(userId);
            } catch (e) {
                 console.error("Invalid userId format:", userId);
                 // Decide how to handle: throw error, or return empty results?
                 // Throwing is safer to prevent unintended data access.
                 throw new BadRequestError("Invalid user ID format");
            }

        } else if (filters.user) {
             try {
                 queryObject.user = new Types.ObjectId(filters.user); // Allow admin to filter by user
             } catch (e) {
                  throw new BadRequestError("Invalid user ID format in filter");
             }
        }

        // Basic filters
        if (filters.type) {
            queryObject.type = filters.type;
        }
        if (filters.description) {
            // Use regex for partial matching, case-insensitive
            queryObject.description = { $regex: filters.description, $options: 'i' };
        }
        if (filters.category) {
             try {
                queryObject.category = new Types.ObjectId(filters.category);
             } catch (e) {
                 throw new BadRequestError("Invalid category ID format in filter");
             }
        }
        if (filters.account) {
             try {
                 queryObject.account = new Types.ObjectId(filters.account);
             } catch (e) {
                 throw new BadRequestError("Invalid account ID format in filter");
             }
        }

        // Date range filtering
        if (filters.startDate || filters.endDate) {
            queryObject.date = {};
            if (filters.startDate) {
                // Attempt to parse date, handle potential errors if format is unexpected
                try {
                    queryObject.date.$gte = new Date(filters.startDate);
                } catch (e) { /* Ignore invalid date format */ }
            }
            if (filters.endDate) {
                try {
                     // Set to end of the day for inclusive filtering
                    const endDate = new Date(filters.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    queryObject.date.$lte = endDate;
                } catch (e) { /* Ignore invalid date format */ }
            }
             // If only one date is invalid, the filter might behave unexpectedly
             // Consider adding validation or error handling for date formats
        }

        // Numeric filters
        if (filters.numericFilters) {
            const operatorMap: { [key: string]: string } = {
                '>': '$gt', '>=': '$gte', '<': '$lt', '<=': '$lte', '=': '$eq', '!=': '$ne'
            };
            const regex = /\b(<|>|>=|<=|=|!=)\b/g;
            let numFilters = filters.numericFilters.replace(regex, (match) => `-${operatorMap[match]}-`);
            const allowedNumericFields = ['amount'];
            numFilters.split(',').forEach((item) => {
                const [field, operator, value] = item.split('-');
                if (allowedNumericFields.includes(field)) {
                     const numValue = Number(value);
                     if (!isNaN(numValue)) { // Ensure value is a valid number
                          queryObject[field] = { [operator]: numValue };
                     }
                }
            });
        }
        return queryObject;
    }

    async getAll(userId: string | null, filters: TransactionQueryFiltersDto): Promise<{ transactions: ITransactionSchema[], totalDocuments: number }> {
        const queryObject = this.buildQueryObject(userId, filters);
        // Explicitly type the query result if necessary, though Mongoose often infers correctly with proper schema/model setup
        let query : any = Transaction.find(queryObject);

        // Sorting
        if (filters.sort) {
            const sortFields = filters.sort.split(',').join(' ');
            query = query.sort(sortFields);
        } else {
            query = query.sort('-date'); // Default sort: newest first
        }

        // Field selection
        if (filters.fields) {
            const fieldsList = filters.fields.split(',').join(' ');
            query = query.select(fieldsList);
        }

        // Pagination
        const pageNumber = Number(filters.page) || 1;
        // Different default limits for user vs admin
        const limitNumber = Number(filters.limit) || (userId ? 10 : 50);
        const skip = (pageNumber - 1) * limitNumber;
        query = query.skip(skip).limit(limitNumber);

        // Populate related data for admin view
        if (!userId) {
            query = query.populate('user', 'username email firstName lastName')
                       .populate('account', 'name type')
                       .populate('category', 'name type');
        }

        // Await the execution of the query
        const transactions: ITransactionSchema[] = await query.exec();
        const totalDocuments = await Transaction.countDocuments(queryObject);

        return { transactions, totalDocuments };
    }

    async findById(transactionId: string, userId: string | null): Promise<ITransactionSchema> {
        let tId: Types.ObjectId;
        try {
            tId = new Types.ObjectId(transactionId);
        } catch (e) {
            throw new BadRequestError("Invalid transaction ID format");
        }

        const queryFilter: any = { _id: tId };
        if (userId) {
             try {
                 queryFilter.user = new Types.ObjectId(userId); // Filter by user if userId is provided
             } catch (e) {
                  throw new BadRequestError("Invalid user ID format");
             }
        }

        let transactionQuery = Transaction.findOne(queryFilter);

        // Populate related data for admin view
        if (!userId) {
             transactionQuery = transactionQuery
                .populate('user', 'username email firstName lastName')
                .populate('account', 'name type balance') // Include balance for context
                .populate('category', 'name type');
        }

        const transaction = await transactionQuery.exec();

        if (!transaction) {
            throw new NotFoundError(`Transaction not found with id ${transactionId}${userId ? ' for the current user' : ''}`);
        }
        // Cast if necessary, although findOne should return the correct type if model is typed
        return transaction as ITransactionSchema;
    }

    async create(userId: string, data: CreateTransactionDto, imageUrl?: string): Promise<ITransactionSchema> {
         let accountId: Types.ObjectId;
         let categoryId: Types.ObjectId;
         let ownerUserId: Types.ObjectId;

         try {
             accountId = new Types.ObjectId(data.account);
             categoryId = new Types.ObjectId(data.category);
             ownerUserId = new Types.ObjectId(userId);
         } catch (e) {
             throw new BadRequestError("Invalid ID format for account, category, or user.");
         }


        const account = await Account.findOne({ _id: accountId, user: ownerUserId });
        if (!account) {
            throw new NotFoundError('Account not found or does not belong to the current user');
        }

        if (data.type === 'expense' && account.balance < data.amount) {
            throw new BadRequestError('Insufficient funds in the selected account');
        }

        const transactionData: Partial<ITransactionSchema> = {
            amount: data.amount,
            type: data.type,
            description: data.description,
            category: categoryId,
            account: accountId,
            user: ownerUserId,
            imgUrl: imageUrl, // Add image URL if provided
            date: data.date ? new Date(data.date) : new Date() // Ensure date is a Date object
        };

        const transaction = new Transaction(transactionData);
        await transaction.save();

        // --- Update Account Balance --- (Atomic operation recommended in production)
        if (transaction.type === 'income') {
            account.balance += transaction.amount;
        } else { // expense
            account.balance -= transaction.amount;
        }
        await account.save();
        // --- End Balance Update ---

        return transaction;
    }

    async update(transactionId: string, userId: string, data: UpdateTransactionDto): Promise<ITransactionSchema> {
        let ownerUserId: Types.ObjectId;
        try {
            ownerUserId = new Types.ObjectId(userId);
        } catch (e) {
            throw new BadRequestError("Invalid user ID format");
        }

        const transaction = await this.findById(transactionId, userId); // Reuse findById to check ownership

        const amountChanged = data.amount !== undefined && data.amount !== transaction.amount;
        const typeChanged = data.type !== undefined && data.type !== transaction.type;

        // --- Update Account Balance if necessary --- (Atomic operation recommended)
        if (amountChanged || typeChanged) {
            const account = await Account.findOne({ _id: transaction.account, user: ownerUserId });
            if (!account) {
                 // This shouldn't happen if transaction ownership is correct, but good safety check
                throw new NotFoundError('Associated account not found or does not belong to the user');
            }

            // 1. Revert old transaction effect
            if (transaction.type === 'income') {
                account.balance -= transaction.amount;
            } else { // expense
                account.balance += transaction.amount;
            }

            // 2. Apply new transaction effect
            const newType = data.type || transaction.type;
            const newAmount = data.amount !== undefined ? data.amount : transaction.amount;

            if (newType === 'income') {
                account.balance += newAmount;
            } else { // expense
                if (account.balance < newAmount) {
                     // Throw error before saving potentially inconsistent state
                    throw new BadRequestError('Insufficient funds after update');
                }
                account.balance -= newAmount;
            }
            await account.save();
        }
        // --- End Balance Update ---

        // Update the transaction document itself
        // Convert IDs in update data if present
        const updateData: any = { ...data }; // Use any temporarily for flexibility
         if (updateData.date) {
             updateData.date = new Date(updateData.date); // Ensure date format
         }
         if (updateData.category) {
             try { updateData.category = new Types.ObjectId(updateData.category); } catch (e) { throw new BadRequestError("Invalid category ID format in update data."); }
         }
          if (updateData.account) {
             // Standard user shouldn't change account via this method, handle in controller or add validation
             console.warn("Attempting to update account via standard update method. This might be unintended.");
             try { updateData.account = new Types.ObjectId(updateData.account); } catch (e) { throw new BadRequestError("Invalid account ID format in update data."); }
         }
          if (updateData.user) {
              // Standard user shouldn't change user via this method
             console.warn("Attempting to update user via standard update method. This might be unintended.");
             try { updateData.user = new Types.ObjectId(updateData.user); } catch (e) { throw new BadRequestError("Invalid user ID format in update data."); }
         }

        // Perform the update
        const updatedTransaction = await Transaction.findByIdAndUpdate(
            transaction._id, // Use the ObjectId from the found transaction
            updateData,
            { new: true, runValidators: true }
        ).exec();

        if (!updatedTransaction) { // Should not happen if findById worked, but safety check
             throw new NotFoundError('Failed to update transaction after balance adjustment.');
        }

        return updatedTransaction as ITransactionSchema;
    }

    async delete(transactionId: string, userId: string | null): Promise<mongoose.Types.ObjectId> {
        let tId: Types.ObjectId;
        let ownerUserId: Types.ObjectId | null = null;
        try {
             tId = new Types.ObjectId(transactionId);
             if(userId) ownerUserId = new Types.ObjectId(userId);
        } catch (e) {
             throw new BadRequestError("Invalid ID format for transaction or user.");
        }

        const queryFilter = ownerUserId ? { _id: tId, user: ownerUserId } : { _id: tId };
        const transaction = await Transaction.findOne(queryFilter);

        if (!transaction) {
             throw new NotFoundError(`Transaction not found with id ${transactionId}${userId ? ' for the current user' : ''}`);
        }
        if (transaction.isDeleted) {
            throw new BadRequestError('Transaction is already deleted');
        }

        // --- Update Account Balance --- (Atomic operation recommended)
        // Find account by ID stored in transaction, no user check needed here for balance reversal
        const account = await Account.findById(transaction.account);
        if (account) { // Proceed only if account exists
            if (transaction.type === 'income') {
                account.balance -= transaction.amount;
            } else { // expense
                account.balance += transaction.amount;
            }
            await account.save();
        }
        // --- End Balance Update ---

        // --- Delete Image from S3 if exists ---
        if (transaction.imgUrl && transaction.imgUrl.includes(env.AWS_S3_BUCKET_NAME || '')) {
            try {
                const urlParts = transaction.imgUrl.split('/');
                const key = urlParts[urlParts.length - 1]; // Get the last part as key

                if (key) { // Ensure key extraction was successful
                    const params = {
                        Bucket: env.AWS_S3_BUCKET_NAME,
                        Key: key
                    };
                    const command = new DeleteObjectCommand(params);
                    await s3Client.send(command);
                    console.log(`Successfully deleted image from S3: ${key}`);
                }
            } catch (s3Error) {
                console.error(`Error deleting image from S3 (key: ${transaction.imgUrl}):`, s3Error);
                // Decide if this error should prevent transaction deletion or just be logged
            }
        }
        // --- End S3 Delete ---

        await transaction.softDelete();
        return transaction._id;
    }

    async restore(transactionId: string, userId: string | null): Promise<ITransactionSchema> {
        let tId: Types.ObjectId;
        let ownerUserId: Types.ObjectId | null = null;
         try {
             tId = new Types.ObjectId(transactionId);
             if(userId) ownerUserId = new Types.ObjectId(userId);
        } catch (e) {
             throw new BadRequestError("Invalid ID format for transaction or user.");
        }

        const queryFilter = ownerUserId ? { _id: tId, user: ownerUserId } : { _id: tId };
        // Correctly chain findOne() onto the Query returned by findDeleted()
        const transaction : any = (await Transaction.findDeleted(queryFilter)).findOne();

        if (!transaction) {
            throw new NotFoundError(`Deleted transaction not found with id ${transactionId}${userId ? ' for the current user' : ''}`);
        }
        // No need to check isDeleted status again, findDeleted handles it.

        // --- Update Account Balance --- (Atomic operation recommended)
        const account = await Account.findById(transaction.account);
         if (!account) {
            throw new NotFoundError('Cannot restore transaction: Associated account not found.');
        }
        // If restoring for a specific user, ensure the account also belongs to them
        if (ownerUserId && account.user.toString() !== ownerUserId.toString()) {
             throw new BadRequestError('Cannot restore transaction: Associated account does not belong to the user.');
        }


        if (transaction.type === 'income') {
            account.balance += transaction.amount;
        } else { // expense
            if (account.balance < transaction.amount) {
                 throw new BadRequestError('Cannot restore transaction: Insufficient funds in the associated account');
            }
            account.balance -= transaction.amount;
        }
        await account.save();
        // --- End Balance Update ---

        // Note: Restoring does not re-upload the image if it was deleted from S3.

        await transaction.restore();
        return transaction;
    }

     async getDeleted(userId: string | null): Promise<ITransactionSchema[]> {
         let ownerUserId: Types.ObjectId | null = null;
          try {
             if(userId) ownerUserId = new Types.ObjectId(userId);
         } catch (e) {
             throw new BadRequestError("Invalid user ID format.");
         }
         const query = ownerUserId ? { user: ownerUserId } : {};
         // Correctly call exec() on the Query returned by findDeleted()
         const deletedTransactions : any = await Transaction.findDeleted(query);
         // Explicitly cast if needed, though Mongoose should infer Array type
         return deletedTransactions as ITransactionSchema[];
    }

    async getByAccount(accountId: string, userId: string): Promise<ITransactionSchema[]> {
         let accId: Types.ObjectId;
         let ownerUserId: Types.ObjectId;
          try {
             accId = new Types.ObjectId(accountId);
             ownerUserId = new Types.ObjectId(userId);
         } catch (e) {
             throw new BadRequestError("Invalid ID format for account or user.");
         }

         // First, verify the user owns the account
        const account = await Account.findOne({ _id: accId, user: ownerUserId });
        if (!account) {
            throw new NotFoundError('Account not found or does not belong to the user');
        }

        // Then, fetch transactions for that account belonging to the user
        const transactions = await Transaction.find({
            account: accId,
            user: ownerUserId
        }).sort('-date').exec(); // Default sort

        return transactions as ITransactionSchema[];
    }

    async getByCategory(categoryId: string, userId: string): Promise<ITransactionSchema[]> {
         let catId: Types.ObjectId;
         let ownerUserId: Types.ObjectId;
          try {
             catId = new Types.ObjectId(categoryId);
             ownerUserId = new Types.ObjectId(userId);
         } catch (e) {
             throw new BadRequestError("Invalid ID format for category or user.");
         }

         // No need to verify category ownership unless required by business logic
        const transactions = await Transaction.find({
            category: catId,
            user: ownerUserId
        }).sort('-date').exec(); // Default sort

        return transactions as ITransactionSchema[];
    }

    // ==================== Admin Methods ====================

    async createAdmin(data: CreateTransactionAdminDto, imageUrl?: string): Promise<ITransactionSchema> {
         let userId: Types.ObjectId;
         let accountId: Types.ObjectId;
         let categoryId: Types.ObjectId;
         try {
             userId = new Types.ObjectId(data.user);
             accountId = new Types.ObjectId(data.account);
             categoryId = new Types.ObjectId(data.category);
         } catch (e) {
             throw new BadRequestError("Invalid ID format for user, account, or category.");
         }

        // Validate referenced User and Account exist
        const userExists = await User.findById(userId);
        if (!userExists) {
            throw new NotFoundError(`User not found with id ${data.user}`);
        }
        const account = await Account.findById(accountId);
        if (!account) {
            throw new NotFoundError(`Account not found with id ${data.account}`);
        }

        // Check funds
        if (data.type === 'expense' && account.balance < data.amount) {
            throw new BadRequestError('Insufficient funds in the selected account');
        }

        const transactionData: Partial<ITransactionSchema> = {
            amount: data.amount,
            type: data.type,
            description: data.description,
            category: categoryId,
            account: accountId,
            user: userId,
            imgUrl: imageUrl,
            date: data.date ? new Date(data.date) : new Date()
        };

        const transaction = new Transaction(transactionData);
        await transaction.save();

        // Update account balance
        if (transaction.type === 'income') {
            account.balance += transaction.amount;
        } else {
            account.balance -= transaction.amount;
        }
        await account.save();

        // Optionally populate before returning
        await transaction.populate([
            { path: 'user', select: 'username email firstName lastName' },
            { path: 'account', select: 'name type' },
            { path: 'category', select: 'name type' }
        ]);

        return transaction;
    }

    async updateAdmin(transactionId: string, data: UpdateTransactionAdminDto): Promise<ITransactionSchema> {
         let tId: Types.ObjectId;
         try {
             tId = new Types.ObjectId(transactionId);
         } catch (e) {
             throw new BadRequestError("Invalid transaction ID format.");
         }

        const transaction = await this.findById(transactionId, null); // Find without user filter

        const amountChanged = data.amount !== undefined && data.amount !== transaction.amount;
        const typeChanged = data.type !== undefined && data.type !== transaction.type;
        // Ensure comparison is done with strings if needed, or convert data.account to ObjectId
        const accountChanged = data.account !== undefined && data.account !== transaction.account.toString();
        const userChanged = data.user !== undefined && data.user !== transaction.user.toString();

         // --- Update Account Balances if necessary --- (Atomic recommended)
        if (amountChanged || typeChanged || accountChanged) {
            // 1. Revert effect on OLD account
            const oldAccount = await Account.findById(transaction.account);
            if (oldAccount) {
                if (transaction.type === 'income') oldAccount.balance -= transaction.amount;
                else oldAccount.balance += transaction.amount;
                await oldAccount.save();
            }

            // 2. Apply effect to NEW account
            let newAccountId: Types.ObjectId;
            try {
                 newAccountId = new Types.ObjectId(data.account || transaction.account.toString());
             } catch (e) {
                 throw new BadRequestError("Invalid new account ID format.");
             }

            const newAccount = await Account.findById(newAccountId);
            if (!newAccount) {
                 throw new NotFoundError(`Account not found with id ${newAccountId}`);
            }

            const newType = data.type || transaction.type;
            const newAmount = data.amount !== undefined ? data.amount : transaction.amount;

            if (newType === 'income') {
                newAccount.balance += newAmount;
            } else { // expense
                if (newAccount.balance < newAmount) {
                    throw new BadRequestError(`Insufficient funds in account ${newAccountId}`);
                }
                newAccount.balance -= newAmount;
            }
            await newAccount.save();
        }
        // --- End Balance Update ---

        // Prepare update data for the transaction
        const updateData: any = { ...data };
        if (updateData.date) {
            updateData.date = new Date(updateData.date);
        }
         // Validate and convert IDs if changed
        if (userChanged) {
             let newUserId: Types.ObjectId;
             try {
                 newUserId = new Types.ObjectId(data.user);
             } catch (e) {
                 throw new BadRequestError("Invalid new user ID format.");
             }
            const userExists = await User.findById(newUserId);
            if (!userExists) {
                throw new NotFoundError(`User not found with id ${data.user}`);
            }
            updateData.user = newUserId;
        } else {
             delete updateData.user; // Don't update if not provided
        }
        if (accountChanged) {
             try {
                 updateData.account = new Types.ObjectId(data.account);
             } catch (e) {
                 throw new BadRequestError("Invalid new account ID format.");
             }
        } else {
             delete updateData.account; // Don't update if not provided
        }
         if (data.category) {
              try {
                 updateData.category = new Types.ObjectId(data.category);
             } catch (e) {
                 throw new BadRequestError("Invalid category ID format.");
             }
         } else {
             delete updateData.category;
         }


        const updatedTransaction = await Transaction.findByIdAndUpdate(
            tId,
            updateData,
            { new: true, runValidators: true }
        ).populate([
            { path: 'user', select: 'username email firstName lastName' },
            { path: 'account', select: 'name type balance' },
            { path: 'category', select: 'name type' }
        ]).exec();

        if (!updatedTransaction) {
             throw new NotFoundError('Failed to update transaction after balance adjustments.');
        }

        return updatedTransaction as ITransactionSchema;
    }

    // deleteAdmin and restoreAdmin can reuse the non-admin versions by passing null for userId
}

export default new TransactionService(); // Export singleton instance 