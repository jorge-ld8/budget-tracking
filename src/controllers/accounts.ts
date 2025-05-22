import type { Response, NextFunction } from 'express'; // Use express types
import AccountService from '../services/AccountService.ts';
import { NotFoundError, BadRequestError } from '../errors/index.ts'; // Keep error imports if needed directly
import type { AccountController as IAccountController } from '../types/controllers.ts'; // Assuming types path
import type { AuthenticatedRequest } from '../types/index.d.ts'; // Assuming a type for authenticated requests
// Import DTOs for type checking and validation
import type { AccountQueryFiltersDto, CreateAccountDto, UpdateAccountDto, UpdateBalanceDto, UpdateAccountAdminDto, UpdateBalanceResponseDto } from '../types/dtos/account.dto.ts';


class AccountController implements IAccountController {
    // Inject or import the service instance
    private accountService : AccountService;

    constructor() {
      this.accountService =  new AccountService();
    }

    async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            // Ensure req.user and req.user._id exist, handle potential undefined case if necessary
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            // Pass query parameters directly; service layer handles parsing DTOs
            const filters: AccountQueryFiltersDto = req.query;

            const { items:accounts, totalDocuments } = await this.accountService.getAll(userId, filters);

            const pageNumber = Number(filters.page) || 1;
            const limitNumber = Number(filters.limit) || 10; // Default limit for standard users

            res.status(200).json({
                accounts,
                count: accounts?.length || 0,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalDocuments / limitNumber),
                total: totalDocuments // Include total count
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.params.id;
             if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const account = await this.accountService.findById(accountId, userId);
            res.status(200).json({ account });
        } catch (error) {
            next(error);
        }
    } 

    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
             if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const accountData: CreateAccountDto = req.body;

            // Basic request body validation (consider using validation middleware)
            if (!accountData.name || !accountData.type) {
                 throw new BadRequestError('Missing required fields: name and type');
            }

            const account = await this.accountService.create(userId, accountData);
            res.status(201).json({ account });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.params.id;
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const deletedAccountId = await this.accountService.delete(accountId, userId);
            res.status(200).json({ accountId: deletedAccountId });
        } catch (error) {
            next(error);
        }
    }

     async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.params.id;
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const updateData: UpdateAccountDto = req.body;

             // Ensure at least one field is being updated
             if (Object.keys(updateData).length === 0) {
                throw new BadRequestError('No update data provided.');
             }

            const account = await this.accountService.update(accountId, userId, updateData);
            res.status(200).json({ account });
        } catch (error) {
            next(error);
        }
    }

     async updateBalance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.params.id;
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const { amount, operation }: UpdateBalanceDto = req.body;

             if (amount === undefined || !operation) {
                 throw new BadRequestError('Missing required fields: amount and operation');
             }
             if (operation !== 'add' && operation !== 'subtract') {
                 throw new BadRequestError('Invalid operation type. Use "add" or "subtract".');
             }
             if (typeof amount !== 'number' || amount < 0) {
                 throw new BadRequestError('Invalid amount provided.');
             }


            const account = await this.accountService.updateBalance(accountId, userId, { amount, operation });

            // Format the specific response DTO
            const response: UpdateBalanceResponseDto = {
                 balance: account.balance,
                 name: account.name,
                 operation: operation,
                 amount: Number(amount), // Ensure it's a number
                 timestamp: account.updatedAt || new Date() // Use updatedAt from model if available
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

     async toggleActive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.params.id;
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const account = await this.accountService.toggleActive(accountId, userId);
            res.status(200).json({ account });
        } catch (error) {
            next(error);
        }
    }

     async restore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.params.id;
            if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
            const userId = req.user._id.toString();
            const account = await this.accountService.restore(accountId, userId);
            res.status(200).json({ account });
        } catch (error) {
            next(error);
        }
    }

    async getDeleted(req: AuthenticatedRequest, res: Response, next: NextFunction) {
         try {
             if (!req.user?._id) {
                 throw new BadRequestError('User authentication information is missing.');
            }
             const userId = req.user._id.toString();
             const deletedAccounts = await this.accountService.getDeleted(userId);
             res.status(200).json({
                 deletedAccounts,
                 count: deletedAccounts.length
             });
         } catch (error) {
             next(error);
         }
    }

    // ==================== Admin-only methods ====================
    // Note: These assume an admin role check middleware runs before them.

    async getAllAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
         try {
             // Pass null userId to indicate admin access (no user filtering)
             const filters: AccountQueryFiltersDto = req.query;
             const { items: accounts, totalDocuments } = await this.accountService.getAll(null, filters);

             const pageNumber = Number(filters.page) || 1;
             const limitNumber = Number(filters.limit) || 50; // Default limit for admin

             res.status(200).json({
                 accounts,
                 count: accounts.length,
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
            const accountId = req.params.id;
            // Pass null userId to indicate admin access
            const account = await this.accountService.findById(accountId, null);
            res.status(200).json({ account });
        } catch (error) {
            next(error);
        }
    }

    async createAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
         try {
             // Explicitly use CreateAccountDto which includes the optional user field
             const accountData: CreateAccountDto & { balance?: number } = req.body;
             // Basic request body validation
             if (!accountData.name || !accountData.type || !accountData.user) {
                  throw new BadRequestError('Missing required fields for admin creation: name, type, and user');
             }
             // Ensure balance is a number if provided
             if (accountData.balance !== undefined && typeof accountData.balance !== 'number') {
                 throw new BadRequestError('Invalid balance provided. Must be a number.');
             }

             const account = await this.accountService.createAdmin(accountData);
             res.status(201).json({ account });
         } catch (error) {
             next(error);
         }
    }

    async updateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
         try {
             const accountId = req.params.id;
             // Use the specific DTO for admin updates if it exists and is different
             const updateData: UpdateAccountAdminDto = req.body;

             if (Object.keys(updateData).length === 0) {
                throw new BadRequestError('No update data provided.');
             }
             // Add specific validation for admin-updatable fields if necessary
             if (updateData.balance !== undefined && typeof updateData.balance !== 'number') {
                 throw new BadRequestError('Invalid balance provided. Must be a number.');
             }
              if (updateData.user !== undefined && typeof updateData.user !== 'string') { // Or ObjectId validation
                 throw new BadRequestError('Invalid user ID provided.');
             }


             const account = await this.accountService.updateAdmin(accountId, updateData);
             res.status(200).json({ account });
         } catch (error) {
             next(error);
         }
    }

    async deleteAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
         try {
             const accountId = req.params.id;
             const deletedAccountId = await this.accountService.delete(accountId, null); // Pass null userId for admin
             res.status(200).json({
                 message: 'Account soft deleted successfully by admin',
                 accountId: deletedAccountId
             });
         } catch (error) {
             next(error);
         }
    }

    async restoreAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const accountId = req.params.id;
            const account = await this.accountService.restore(accountId, null); // Pass null userId for admin
            res.status(200).json({ message: 'Account restored successfully by admin', account });
        } catch (error) {
            next(error);
        }
    }
}

export default AccountController; // Export a singleton instance 