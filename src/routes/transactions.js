const BaseRouter = require('../interfaces/BaseRouter');
const { authenticate } = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - amount
 *         - type
 *         - description
 *         - category
 *         - account
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         amount:
 *           type: number
 *           description: Transaction amount
 *         type:
 *           type: string
 *           enum: [income, expense]
 *           description: Transaction type
 *         description:
 *           type: string
 *           description: Transaction description
 *         date:
 *           type: string
 *           format: date-time
 *           description: Transaction date
 *         category:
 *           type: string
 *           description: Reference to category ID
 *         account:
 *           type: string
 *           description: Reference to account ID
 *         user:
 *           type: string
 *           description: Reference to user ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Update timestamp
 */

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management API
 */

class TransactionsRouter extends BaseRouter {
  async initializeRoutes() {
    this.router.use(authenticate);

    /**
     * @swagger
     * /transactions:
     *   get:
     *     summary: Returns a list of transactions
     *     tags: [Transactions]
     *     parameters:
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: [income, expense]
     *         description: Filter by transaction type
     *         example: expense
     *       - in: query
     *         name: description
     *         schema:
     *           type: string
     *         description: Search by description
     *         example: grocery
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *         description: Filter by category ID
     *         example: 60d21b4667d0d8992e610c85
     *       - in: query
     *         name: account
     *         schema:
     *           type: string
     *         description: Filter by account ID
     *         example: 60d21b4667d0d8992e610c86
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *         description: Filter by start date (YYYY-MM-DD)
     *         example: 2023-06-01
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *         description: Filter by end date (YYYY-MM-DD)
     *         example: 2023-06-30
     *       - in: query
     *         name: sort
     *         schema:
     *           type: string
     *         description: Sort fields (comma separated)
     *         example: -date,amount
     *       - in: query
     *         name: fields
     *         schema:
     *           type: string
     *         description: Select specific fields (comma separated)
     *         example: amount,description,date
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *         description: Page number
     *         example: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         description: Items per page
     *         example: 10
     *     responses:
     *       200:
     *         description: The list of transactions
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 transactions:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Transaction'
     *                 count:
     *                   type: integer
     *                 page:
     *                   type: integer
     *                 limit:
     *                   type: integer
     *                 totalPages:
     *                   type: integer
     *             examples:
     *               transactionsList:
     *                 value:
     *                   transactions:
     *                     - _id: "60d21b4667d0d8992e610c89"
     *                       amount: 50.75
     *                       type: "expense"
     *                       description: "Grocery shopping"
     *                       date: "2023-06-15T10:30:00Z"
     *                       category: "60d21b4667d0d8992e610c85"
     *                       account: "60d21b4667d0d8992e610c86"
     *                       user: "60d21b4667d0d8992e610c84"
     *                     - _id: "60d21b4667d0d8992e610c90"
     *                       amount: 1500
     *                       type: "income"
     *                       description: "Salary payment"
     *                       date: "2023-06-01T09:00:00Z"
     *                       category: "60d21b4667d0d8992e610c87"
     *                       account: "60d21b4667d0d8992e610c88"
     *                       user: "60d21b4667d0d8992e610c84"
     *                   count: 2
     *                   page: 1
     *                   limit: 10
     *                   totalPages: 1
     */
    this.router.get('/', this.controller.getAll);

    /**
     * @swagger
     * /transactions/{id}:
     *   get:
     *     summary: Get a transaction by ID
     *     tags: [Transactions]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The transaction ID
     *     responses:
     *       200:
     *         description: The transaction details
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 transaction:
     *                   $ref: '#/components/schemas/Transaction'
     *       404:
     *         description: Transaction not found
     */
    this.router.get('/:id', this.controller.getById);

    /**
     * @swagger
     * /transactions:
     *   post:
     *     summary: Create a new transaction
     *     tags: [Transactions]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - amount
     *               - type
     *               - description
     *               - category
     *               - account
     *             properties:
     *               amount:
     *                 type: number
     *               type:
     *                 type: string
     *                 enum: [income, expense]
     *               description:
     *                 type: string
     *               date:
     *                 type: string
     *                 format: date-time
     *               category:
     *                 type: string
     *               account:
     *                 type: string
     *           examples:
     *             expense:
     *               value:
     *                 amount: 50.75
     *                 type: "expense"
     *                 description: "Grocery shopping"
     *                 date: "2023-06-15T10:30:00Z"
     *                 category: "60d21b4667d0d8992e610c85"
     *                 account: "60d21b4667d0d8992e610c86"
     *             income:
     *               value:
     *                 amount: 1500
     *                 type: "income"
     *                 description: "Salary payment"
     *                 date: "2023-06-01T09:00:00Z"
     *                 category: "60d21b4667d0d8992e610c87"
     *                 account: "60d21b4667d0d8992e610c88"
     *     responses:
     *       201:
     *         description: Created
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 transaction:
     *                   $ref: '#/components/schemas/Transaction'
     */
    this.router.post('/', this.controller.create);

    /**
     * @swagger
     * /transactions/{id}:
     *   patch:
     *     summary: Update a transaction
     *     tags: [Transactions]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The transaction ID
     *         example: "60d21b4667d0d8992e610c89"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               amount:
     *                 type: number
     *               type:
     *                 type: string
     *                 enum: [income, expense]
     *               description:
     *                 type: string
     *               date:
     *                 type: string
     *                 format: date-time
     *               category:
     *                 type: string
     *           examples:
     *             updateAmount:
     *               summary: Update transaction amount
     *               value:
     *                 amount: 65.99
     *             updateDescription:
     *               summary: Update transaction description
     *               value:
     *                 description: "Updated grocery purchase"
     *             updateMultipleFields:
     *               summary: Update multiple fields
     *               value:
     *                 amount: 75.50
     *                 description: "Weekly groceries"
     *                 date: "2023-06-16T14:30:00Z"
     *     responses:
     *       200:
     *         description: Updated
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 transaction:
     *                   $ref: '#/components/schemas/Transaction'
     *       404:
     *         description: Transaction not found
     */
    this.router.patch('/:id', this.controller.update);

    /**
     * @swagger
     * /transactions/{id}:
     *   delete:
     *     summary: Delete a transaction
     *     tags: [Transactions]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The transaction ID
     *         example: 60d21b4667d0d8992e610c89
     *     responses:
     *       200:
     *         description: Deleted
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *             examples:
     *               success:
     *                 value:
     *                   message: "Transaction deleted successfully"
     *       404:
     *         description: Transaction not found
     *         content:
     *           application/json:
     *             examples:
     *               notFound:
     *                 value:
     *                   error: "Transaction not found"
     */
    this.router.delete('/:id', this.controller.delete);

    /**
     * @swagger
     * /transactions/account/{accountId}:
     *   get:
     *     summary: Get transactions by account
     *     tags: [Transactions]
     *     parameters:
     *       - in: path
     *         name: accountId
     *         schema:
     *           type: string
     *         required: true
     *         description: The account ID
     *     responses:
     *       200:
     *         description: List of transactions for the account
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 transactions:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Transaction'
     *                 count:
     *                   type: integer
     */
    this.router.get('/account/:accountId', this.controller.getByAccount);

    /**
     * @swagger
     * /transactions/category/{categoryId}:
     *   get:
     *     summary: Get transactions by category
     *     tags: [Transactions]
     *     parameters:
     *       - in: path
     *         name: categoryId
     *         schema:
     *           type: string
     *         required: true
     *         description: The category ID
     *     responses:
     *       200:
     *         description: List of transactions for the category
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 transactions:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Transaction'
     *                 count:
     *                   type: integer
     */
    this.router.get('/category/:categoryId', this.controller.getByCategory);
  }
}

module.exports = TransactionsRouter; 