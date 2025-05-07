import type { Response, NextFunction } from 'express';
import TransactionService from '../services/TransactionsService.ts';
import { BadRequestError } from '../errors/index.ts';
// Remove unused model imports if service handles all DB interaction
// import Transaction from '../models/transactions.ts';
// import Account from '../models/accounts.ts';
// import s3Client from '../config/s3Config.js';
// import env from '../config/env.js';
// import { DeleteObjectCommand } from '@aws-sdk/client-s3';

import type { TransactionController as ITransactionController } from '../types/controllers.ts';
import type { AuthenticatedRequest } from '../types/index.d.ts';
import type { TransactionQueryFiltersDto, CreateTransactionDto, UpdateTransactionDto, CreateTransactionAdminDto, UpdateTransactionAdminDto } from '../types/dtos/transaction.dto.ts';

class TransactionController implements ITransactionController {
    private transactionService : TransactionService;

    constructor() {
        this.transactionService = new TransactionService();
    }

    async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const filters: TransactionQueryFiltersDto = req.query;
            console.log(req.query);

            const { items: transactions, totalDocuments } = await this.transactionService.getAll(userId, filters);

            const pageNumber = Number(filters.page) || 1;
            const limitNumber = Number(filters.limit) || 10; // Default limit for standard users

            res.status(200).json({
                transactions,
                count: transactions?.length || 0, // Use nbHits or count consistently
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
            const transactionId = req.params.id;
            const userId = req.user._id.toString();

            const transaction = await this.transactionService.findById(transactionId, userId);
            res.status(200).json({ transaction });
        } catch (error) {
            next(error);
        }
    }

    async create(req: AuthenticatedRequest & { file?: any }, res: Response, next: NextFunction) {
        try {
             if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const transactionData: CreateTransactionDto = req.body;

            // Basic validation (consider using validation middleware)
            if (!transactionData.amount || !transactionData.type || !transactionData.description || !transactionData.category || !transactionData.account) {
                 throw new BadRequestError('Missing required fields for transaction creation.');
            }

            // Handle potential image URL from file upload (Multer/S3) or request body (UploadThing)
            let imageUrl: string | undefined = undefined;
            if (req.file) {
                // Assuming req.file.location is set by multer-s3 or similar
                imageUrl = (req.file as any).location; // Cast to any if type is uncertain
            }
            // else if (req.body.imgUrl) { // Prioritize file upload if both present?
            //     imageUrl = req.body.imgUrl;
            // }

            const transaction = await this.transactionService.create(userId, transactionData, imageUrl);
            res.status(201).json({ transaction });
        } catch (error) {
            // Handle specific errors like insufficient funds if needed
            next(error);
        }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const transactionId = req.params.id;
            const userId = req.user._id.toString();
            const updateData: UpdateTransactionDto = req.body;

            if (Object.keys(updateData).length === 0) {
                throw new BadRequestError('No update data provided.');
            }

            // Note: Image updates are not handled here, usually requires a separate endpoint/logic

            const updatedTransaction = await this.transactionService.update(transactionId, userId, updateData);
            res.status(200).json({ transaction: updatedTransaction });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const transactionId = req.params.id;
            const userId = req.user._id.toString();

            const deletedId = await this.transactionService.delete(transactionId, userId);
            res.status(200).json({ message: 'Transaction soft deleted successfully', transactionId: deletedId });
        } catch (error) {
            next(error);
        }
    }

    async restore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
             if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const transactionId = req.params.id;
            const userId = req.user._id.toString();

            // *** Assumes TransactionService.restore is fixed and works correctly ***
            const transaction = await this.transactionService.restore(transactionId, userId);
            res.status(200).json({ message: 'Transaction restored successfully', transaction });
        } catch (error) {
            // Log or handle potential errors from the service method if it's not yet fixed
            console.error("Error in TransactionController.restore potentially due to unfixed service method:", error);
            next(error);
        }
    }

    async getDeleted(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();

            // *** Assumes TransactionService.getDeleted is fixed and works correctly ***
            const deletedTransactions = await this.transactionService.getDeleted(userId);
            res.status(200).json({
                deletedTransactions,
                count: deletedTransactions.length
            });
        } catch (error) {
            // Log or handle potential errors from the service method if it's not yet fixed
            console.error("Error in TransactionController.getDeleted potentially due to unfixed service method:", error);
            next(error);
        }
    }

    async getByAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {  
        try {
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const accountId = req.params.id;
            const userId = req.user._id.toString();

            const transactions = await this.transactionService.getByAccount(accountId, userId);
            res.status(200).json({
                transactions,
                count: transactions.length
            });
        } catch (error) {
            next(error);
        }
    }

    async getByCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const categoryId = req.params.id;
            const userId = req.user._id.toString();

            const transactions = await this.transactionService.getByCategory(categoryId, userId);
            res.status(200).json({
                transactions,
                count: transactions.length
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== Admin-only methods ====================
    // Assumes isAdmin middleware runs before these

    async getAllAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            // No user ID passed, service handles fetching all
            const filters: TransactionQueryFiltersDto = req.query;
            const { items: transactions, totalDocuments } = await this.transactionService.getAll(null, filters);

            const pageNumber = Number(filters.page) || 1;
            const limitNumber = Number(filters.limit) || 50; // Default admin limit

             res.status(200).json({
                transactions,
                count: transactions.length,
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
            const transactionId = req.params.id;
            // Pass null userId for admin access
            const transaction = await this.transactionService.findById(transactionId, null);
            res.status(200).json({ transaction });
        } catch (error) {
            next(error);
        }
    }

    async createAdmin(req: AuthenticatedRequest & { file?: any }, res: Response, next: NextFunction) {
        try {
            // Admin needs to provide user ID in the body
            const transactionData: CreateTransactionAdminDto = req.body;

            if (!transactionData.amount || !transactionData.type || !transactionData.description || !transactionData.category || !transactionData.account || !transactionData.user) {
                 throw new BadRequestError('Missing required fields for admin transaction creation.');
            }

            // Handle image URL if provided (e.g., from form data or direct URL)
            let imageUrl: string | undefined = undefined;
             if (req.file) {
                imageUrl = (req.file as any).location;
            }
            // else if (req.body.imgUrl) { imageUrl = req.body.imgUrl; }

            const transaction = await this.transactionService.createAdmin(transactionData, imageUrl);
            res.status(201).json({ transaction });
        } catch (error) {
            next(error);
        }
    }

    async updateAdmin(req: AuthenticatedRequest & { file?: any }, res: Response, next: NextFunction) {
        try {
            const transactionId = req.params.id;
            const updateData: UpdateTransactionAdminDto = req.body;

            if (Object.keys(updateData).length === 0) {
                throw new BadRequestError('No update data provided.');
            }

            const updatedTransaction = await this.transactionService.updateAdmin(transactionId, updateData);
            res.status(200).json({ transaction: updatedTransaction });
        } catch (error) {
            next(error);
        }
    }

    async deleteAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const transactionId = req.params.id;
            // Pass null userId for admin delete
            const deletedId = await this.transactionService.delete(transactionId, null);
            res.status(200).json({ message: 'Transaction soft deleted successfully by admin', transactionId: deletedId });
        } catch (error) {
            next(error);
        }
    }

    async restoreAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const transactionId = req.params.id;
            // Pass null userId for admin restore
             // *** Assumes TransactionService.restore is fixed ***
            const transaction = await this.transactionService.restore(transactionId, null);
            res.status(200).json({ message: 'Transaction restored successfully by admin', transaction });
        } catch (error) {
            // Log or handle potential errors from the service method if it's not yet fixed
            console.error("Error in TransactionController.restoreAdmin potentially due to unfixed service method:", error);
            next(error);
        }
    }

     // Admin getting all deleted transactions - uses same service method as user but passes null
     async getDeletedAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
         try {
             // *** Assumes TransactionService.getDeleted is fixed ***
             const deletedTransactions = await this.transactionService.getDeleted(null);
             res.status(200).json({
                 deletedTransactions,
                 count: deletedTransactions.length
             });
         } catch (error) {
             // Log or handle potential errors from the service method if it's not yet fixed
             console.error("Error in TransactionController.getDeletedAdmin potentially due to unfixed service method:", error);
             next(error);
         }
     }
}

// Export a singleton instance, consistent with AccountController
export default TransactionController;