import { BaseRouter } from '../interfaces/BaseRouter.ts';
import { authenticate, isAdmin } from '../middlewares/auth.ts';
import type { AccountController } from '../types/controllers.ts';

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Account management API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the account
 *         name:
 *           type: string
 *           description: Account name
 *         balance:
 *           type: number
 *           description: Current account balance
 *           default: 0
 *         type:
 *           type: string
 *           enum: [cash, bank, credit, investment, other]
 *           description: Type of account
 *           default: bank
 *         description:
 *           type: string
 *           description: Optional account description
 *         isActive:
 *           type: boolean
 *           description: Whether the account is active
 *           default: true
 *         user:
 *           type: string
 *           description: Reference to the user who owns this account
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the account was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the account was last updated
 *         isDeleted:
 *           type: boolean
 *           description: Whether the account has been soft deleted
 *           default: false
 *     AccountCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - user
 *       properties:
 *         name:
 *           type: string
 *           description: Account name
 *         type:
 *           type: string
 *           enum: [cash, bank, credit, investment, other]
 *           description: Type of account
 *           default: bank
 *         description:
 *           type: string
 *           description: Optional account description
 *         user:
 *           type: string
 *           description: ID of the user who owns this account
 *     AccountUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Account name
 *         type:
 *           type: string
 *           enum: [cash, bank, credit, investment, other]
 *           description: Type of account
 *         description:
 *           type: string
 *           description: Optional account description
 *         isActive:
 *           type: boolean
 *           description: Whether the account is active
 *     BalanceUpdateRequest:
 *       type: object
 *       required:
 *         - amount
 *         - operation
 *       properties:
 *         amount:
 *           type: number
 *           description: Amount to add or subtract
 *         operation:
 *           type: string
 *           enum: [add, subtract]
 *           description: Operation to perform on the balance
 */

class AccountRouter extends BaseRouter<AccountController> {
    constructor(controller: AccountController) {
        super(controller);
    }
    
    async initializeRoutes() {
        this.router.use(authenticate as any);
        
        /**
         * @swagger
         * /accounts:
         *   get:
         *     summary: Get all accounts
         *     tags: [Accounts]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: type
         *         schema:
         *           type: string
         *           enum: [cash, bank, credit, investment, other]
         *         description: Filter accounts by type
         *       - in: query
         *         name: name
         *         schema:
         *           type: string
         *         description: Search by name or description
         *       - in: query
         *         name: sort
         *         schema:
         *           type: string
         *         description: Sort order (comma separated fields, prefix with - for descending)
         *         example: -createdAt,name
         *       - in: query
         *         name: fields
         *         schema:
         *           type: string
         *         description: Fields to include (comma separated)
         *         example: name,balance,type
         *       - in: query
         *         name: page
         *         schema:
         *           type: integer
         *           minimum: 1
         *           default: 1
         *         description: Page number
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *           minimum: 1
         *           maximum: 100
         *           default: 10
         *         description: Results per page
         *       - in: query
         *         name: numericFilters
         *         schema:
         *           type: string
         *         description: Numeric filters for balance (e.g. balance>100)
         *         example: balance>1000,balance<5000
         *     responses:
         *       200:
         *         description: List of accounts
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 accounts:
         *                   type: array
         *                   items:
         *                     $ref: '#/components/schemas/Account'
         *                 nbHits:
         *                   type: integer
         *                   description: Number of returned results
         *                 page:
         *                   type: integer
         *                   description: Current page
         *                 limit:
         *                   type: integer
         *                   description: Results per page
         *                 totalPages:
         *                   type: integer
         *                   description: Total number of pages
         *       401:
         *         description: Unauthorized
         */
        this.router.get('/', this.controller.getAll);

        /**
         * @swagger
         * /accounts/{id}:
         *   get:
         *     summary: Get account by ID
         *     tags: [Accounts]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: Account ID
         *     responses:
         *       200:
         *         description: Account details
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 account:
         *                   $ref: '#/components/schemas/Account'
         *       404:
         *         description: Account not found
         *       401:
         *         description: Unauthorized
         */
        this.router.get('/:id', this.controller.getById);

        /**
         * @swagger
         * /accounts:
         *   post:
         *     summary: Create a new account
         *     tags: [Accounts]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/AccountCreateRequest'
         *     responses:
         *       201:
         *         description: Account created successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 account:
         *                   $ref: '#/components/schemas/Account'
         *       400:
         *         description: Invalid request data
         *       401:
         *         description: Unauthorized
         */
        this.router.post('/', this.controller.create);

        /**
         * @swagger
         * /accounts/{id}:
         *   patch:
         *     summary: Update account information
         *     tags: [Accounts]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: Account ID
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/AccountUpdateRequest'
         *     responses:
         *       200:
         *         description: Account updated successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 account:
         *                   $ref: '#/components/schemas/Account'
         *       404:
         *         description: Account not found
         *       400:
         *         description: Invalid request data
         *       401:
         *         description: Unauthorized
         */
        this.router.patch('/:id', this.controller.update);

        /**
         * @swagger
         * /accounts/{id}:
         *   delete:
         *     summary: Soft delete an account
         *     tags: [Accounts]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: Account ID
         *     responses:
         *       200:
         *         description: Account soft deleted successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *                   example: Account soft deleted successfully
         *       400:
         *         description: Account is already deleted
         *       404:
         *         description: Account not found
         *       401:
         *         description: Unauthorized
         */
        this.router.delete('/:id', this.controller.delete);

        /**
         * @swagger
         * /accounts/user:
         *   get:
         *     summary: Get accounts for the authenticated user
         *     tags: [Accounts]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: List of accounts for the authenticated user
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 accounts:
         *                   type: array
         *                   items:
         *                     $ref: '#/components/schemas/Account'
         *       401:
         *         description: Unauthorized
         */
        this.router.get('/user', this.controller.findByUser);

        /**
         * @swagger
         * /accounts/{id}/balance:
         *   patch:
         *     summary: Update account balance
         *     tags: [Accounts]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: Account ID
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/BalanceUpdateRequest'
         *     responses:
         *       200:
         *         description: Balance updated successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 balance:
         *                   type: number
         *                   description: New balance
         *                 name:
         *                   type: string
         *                   description: Account name
         *                 operation:
         *                   type: string
         *                   enum: [add, subtract]
         *                   description: Operation that was performed
         *                 amount:
         *                   type: number
         *                   description: Amount that was added or subtracted
         *                 timestamp:
         *                   type: string
         *                   format: date-time
         *                   description: When the operation was performed
         *       400:
         *         description: Invalid request or insufficient funds
         *       404:
         *         description: Account not found
         *       401:
         *         description: Unauthorized
         */
        this.router.patch('/:id/balance', this.controller.updateBalance);

        /**
         * @swagger
         * /accounts/{id}/toggle-active:
         *   patch:
         *     summary: Toggle account active status
         *     tags: [Accounts]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: Account ID
         *     responses:
         *       200:
         *         description: Active status toggled successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 account:
         *                   $ref: '#/components/schemas/Account'
         *       400:
         *         description: Cannot change active status of a deleted account
         *       404:
         *         description: Account not found
         *       401:
         *         description: Unauthorized
         */
        this.router.patch('/:id/toggle-active', this.controller.toggleActive);
        
        /**
         * @swagger
         * /accounts/deleted/all:
         *   get:
         *     summary: Get all soft-deleted accounts
         *     tags: [Accounts]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: List of deleted accounts
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 deletedAccounts:
         *                   type: array
         *                   items:
         *                     $ref: '#/components/schemas/Account'
         *                 count:
         *                   type: integer
         *                   description: Number of deleted accounts
         *       401:
         *         description: Unauthorized
         */
        this.router.get('/deleted/all', this.controller.getDeleted);

        /**
         * @swagger
         * /accounts/{id}/restore:
         *   post:
         *     summary: Restore a soft-deleted account
         *     tags: [Accounts]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: Account ID
         *     responses:
         *       200:
         *         description: Account restored successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *                   example: Account restored successfully
         *                 account:
         *                   $ref: '#/components/schemas/Account'
         *       400:
         *         description: Account is not deleted
         *       404:
         *         description: Account not found
         *       401:
         *         description: Unauthorized
         */
        this.router.post('/:id/restore', this.controller.restore);
        
        // Admin routes without Swagger documentation
        this.router.get('/admin/all', isAdmin as any, this.controller.getAllAdmin);
        this.router.get('/admin/deleted/all', isAdmin as any, this.controller.getDeleted);
        this.router.get('/admin/:id', isAdmin as any, this.controller.getByIdAdmin);
        this.router.post('/admin', isAdmin as any, this.controller.createAdmin);
        this.router.patch('/admin/:id', isAdmin as any, this.controller.updateAdmin);
        this.router.delete('/admin/:id', isAdmin as any, this.controller.deleteAdmin);
        this.router.post('/admin/:id/restore', isAdmin as any, this.controller.restoreAdmin);
    }
}

export default AccountRouter; 