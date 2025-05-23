import { authenticate, isAdmin } from '../middlewares/auth.ts';
import BudgetController from '../controllers/budgets.ts';
import { BaseRouter } from '../interfaces/BaseRouter.ts';
import { validateRequest } from '../middlewares/validateRequest.ts';
import { createBudgetSchema, updateBudgetSchema, idSchema, typeSchema, periodSchema } from '../validators/budget.validator.ts';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../types/index.d.ts';
/**
 * @swagger
 * components:
 *   schemas:
 *     Budget:
 *       type: object
 *       required:
 *         - amount
 *         - period
 *         - category
 *         - startDate
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         amount:
 *           type: number
 *           description: Budget amount
 *         period:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           description: Budget period
 *         category:
 *           type: object
 *           description: Reference to category for this budget
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             type:
 *               type: string
 *               enum: [income, expense]
 *             icon:
 *               type: string
 *             color:
 *               type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date for this budget
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date for this budget (null if ongoing)
 *         isRecurring:
 *           type: boolean
 *           description: Whether the budget recurs each period
 *           default: true
 *         user:
 *           type: string
 *           description: Reference to user ID who owns this budget
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Update timestamp
 *         isDeleted:
 *           type: boolean
 *           description: Whether the budget is soft deleted
 */

/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: Budget management API
 */

class BudgetsRouter extends BaseRouter<BudgetController> {
  constructor(controller: BudgetController) {
    super(controller);
  }

  async initializeRoutes() {
    this.router.use(authenticate as any);
    /**
     * @swagger
     * /budgets:
     *   get:
     *     summary: Returns a list of budgets
     *     tags: [Budgets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: period
     *         schema:
     *           type: string
     *           enum: [daily, weekly, monthly, yearly]
     *         description: Filter by budget period
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *         description: Filter by category ID
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *         description: Filter budgets starting on or after this date (YYYY-MM-DD)
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *         description: Filter budgets ending on or before this date, or recurring budgets active before this date (YYYY-MM-DD)
     *       - in: query
     *         name: numericFilters
     *         schema:
     *           type: string
     *         description: Filter by numeric conditions (e.g., amount>100,amount<=1000)
     *       - in: query
     *         name: sort
     *         schema:
     *           type: string
     *         description: Sort fields (comma separated)
     *       - in: query
     *         name: fields
     *         schema:
     *           type: string
     *         description: Select specific fields (comma separated)
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         description: Items per page
     *     responses:
     *       200:
     *         description: The list of budgets
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 budgets:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Budget'
     *                 count:
     *                   type: integer
     *                 page:
     *                   type: integer
     *                 limit:
     *                   type: integer
     *                 totalPages:
     *                   type: integer
     */
    this.router.get('/', 
      (req, res, next) => this.controller.getAll(req as AuthenticatedRequest, res, next));

    /**
     * @swagger
     * /budgets:
     *   post:
     *     summary: Create a new budget
     *     tags: [Budgets]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - amount
     *               - period
     *               - category
     *               - startDate
     *             properties:
     *               amount:
     *                 type: number
     *                 description: Budget amount
     *               period:
     *                 type: string
     *                 enum: [daily, weekly, monthly, yearly]
     *                 description: Budget period
     *               category:
     *                 type: string
     *                 description: Category ID
     *               startDate:
     *                 type: string
     *                 format: date
     *                 description: Start date for this budget
     *               endDate:
     *                 type: string
     *                 format: date
     *                 description: End date for this budget (omit if ongoing)
     *               isRecurring:
     *                 type: boolean
     *                 description: Whether the budget recurs each period
     *     responses:
     *       201:
     *         description: Budget created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 budget:
     *                   $ref: '#/components/schemas/Budget'
     */
    this.router.post('/', 
      validateRequest(z.object({ body: createBudgetSchema })), 
      (req, res, next) => this.controller.create(req as AuthenticatedRequest, res, next));
    
    /**
     * @swagger
     * /budgets/deleted:
     *   get:
     *     summary: Get all soft-deleted budgets
     *     tags: [Budgets]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of soft-deleted budgets
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 deletedBudgets:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Budget'
     *                 count:
     *                   type: integer
     */
    this.router.get('/deleted', (req, res, next) => this.controller.getDeleted(req as AuthenticatedRequest, res, next));

    /**
     * @swagger
     * /budgets/current:
     *   get:
     *     summary: Get currently active budgets
     *     tags: [Budgets]
     *     security:
     *       - bearerAuth: []
     *     description: Returns budgets that are currently active based on date ranges
     *     responses:
     *       200:
     *         description: List of active budgets
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 budgets:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Budget'
     *                 count:
     *                   type: integer
     */
    this.router.get('/current', (req, res, next) => this.controller.getCurrent(req as AuthenticatedRequest, res, next));

    /**
     * @swagger
     * /budgets/period/{period}:
     *   get:
     *     summary: Get budgets by period
     *     tags: [Budgets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: period
     *         schema:
     *           type: string
     *           enum: [daily, weekly, monthly, yearly]
     *         required: true
     *         description: The budget period
     *     responses:
     *       200:
     *         description: List of budgets for the specified period
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 budgets:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Budget'
     *                 count:
     *                   type: integer
     *       400:
     *         description: Invalid budget period
     */
    this.router.get('/period/:period', 
      validateRequest(z.object({ params: periodSchema })), 
      (req, res, next) => this.controller.getByPeriod(req as AuthenticatedRequest, res, next));

    /**
     * @swagger
     * /budgets/category-type/{type}:
     *   get:
     *     summary: Get budgets by category type
     *     tags: [Budgets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: type
     *         schema:
     *           type: string
     *           enum: [income, expense]
     *         required: true
     *         description: The category type
     *     responses:
     *       200:
     *         description: List of budgets for the specified category type
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 budgets:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Budget'
     *                 count:
     *                   type: integer
     *       400:
     *         description: Invalid category type
     */
    this.router.get('/category-type/:type', 
      validateRequest(z.object({ params: typeSchema })), 
      (req, res, next) => this.controller.getByCategoryType(req as AuthenticatedRequest, res, next));

    /**
     * @swagger
     * /budgets/{id}:
     *   get:
     *     summary: Get a budget by ID
     *     tags: [Budgets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The budget ID
     *     responses:
     *       200:
     *         description: The budget details
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 budget:
     *                   $ref: '#/components/schemas/Budget'
     *       404:
     *         description: Budget not found
     */
    this.router.get('/:id', 
      validateRequest(z.object({ params: idSchema })), 
      (req, res, next) => this.controller.getById(req as AuthenticatedRequest, res, next));

    /**
     * @swagger
     * /budgets/{id}:
     *   patch:
     *     summary: Update a budget
     *     tags: [Budgets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The budget ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               amount:
     *                 type: number
     *               period:
     *                 type: string
     *                 enum: [daily, weekly, monthly, yearly]
     *               category:
     *                 type: string
     *                 description: Category ID
     *               startDate:
     *                 type: string
     *                 format: date-time
     *               endDate:
     *                 type: string
     *                 format: date-time
     *               isRecurring:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Budget updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 budget:
     *                   $ref: '#/components/schemas/Budget'
     *       404:
     *         description: Budget not found
     *       400:
     *         description: Validation error
     */
    this.router.patch('/:id', 
      validateRequest(z.object({ params: idSchema, body: updateBudgetSchema })), 
      (req, res, next) => this.controller.update(req as AuthenticatedRequest, res, next));

    /**
     * @swagger
     * /budgets/{id}:
     *   delete:
     *     summary: Soft delete a budget
     *     tags: [Budgets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The budget ID
     *     responses:
     *       200:
     *         description: Budget soft deleted successfully
     *       404:
     *         description: Budget not found
     *       400:
     *         description: Budget is already deleted
     */
    this.router.delete('/:id', 
      validateRequest(z.object({ params: idSchema })), 
      (req, res, next) => this.controller.delete(req as AuthenticatedRequest, res, next));

    /**
     * @swagger
     * /budgets/{id}/restore:
     *   patch:
     *     summary: Restore a soft-deleted budget
     *     tags: [Budgets]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The budget ID
     *     responses:
     *       200:
     *         description: Budget restored successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 budget:
     *                   $ref: '#/components/schemas/Budget'
     *       404:
     *         description: Budget not found
     *       400:
     *         description: Budget is not deleted
     */
    this.router.patch('/:id/restore', 
      validateRequest(z.object({ params: idSchema })), 
      (req, res, next) => this.controller.restore(req as AuthenticatedRequest, res, next));

    // Admin routes without Swagger documentation
    this.router.get('/admin/all', isAdmin as any, (req, res, next) => this.controller.getAllAdmin(req as AuthenticatedRequest, res, next));
    this.router.get('/admin/deleted/all', isAdmin as any, (req, res, next) => this.controller.getDeletedAdmin(req as AuthenticatedRequest, res, next)); 
    this.router.get('/admin/:id', isAdmin as any, (req, res, next) => this.controller.getByIdAdmin(req as AuthenticatedRequest, res, next));
    this.router.post('/admin', isAdmin as any, (req, res, next) => this.controller.createAdmin(req as AuthenticatedRequest, res, next));
    this.router.patch('/admin/:id', isAdmin as any, (req, res, next) => this.controller.updateAdmin(req as AuthenticatedRequest, res, next));
    this.router.delete('/admin/:id', isAdmin as any, (req, res, next) => this.controller.deleteAdmin(req as AuthenticatedRequest, res, next));
    this.router.post('/admin/:id/restore', isAdmin as any, (req, res, next) => this.controller.restoreAdmin(req as AuthenticatedRequest, res, next));
  }
}

export default BudgetsRouter; 