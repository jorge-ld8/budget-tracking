import { authenticate } from '../middlewares/auth.ts';
import type { ReportsController } from '../types/controllers.ts';
import { Router } from 'express';
class ReportsRouter{
  private router: Router;
  private controller: ReportsController;

  constructor(controller: ReportsController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  getRouter() {
    return this.router;
  }

  initializeRoutes() {
    // Apply authentication middleware to all routes
    this.router.use(authenticate as any);

    /**
     * @swagger
     * /reports/spending-by-category:
     *   get:
     *     summary: Get spending breakdown by category
     *     tags: [Reports]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *         required: true
     *         description: Start date for report (YYYY-MM-DD)
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *         required: true
     *         description: End date for report (YYYY-MM-DD)
     *     responses:
     *       200:
     *         description: Report of spending by category
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     */
    this.router.get('/spending-by-category', this.controller.getSpendingByCategory);

    /**
     * @swagger
     * /reports/income-vs-expenses:
     *   get:
     *     summary: Get income vs expenses for a period
     *     tags: [Reports]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *         required: true
     *         description: Start date for report (YYYY-MM-DD)
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *         required: true
     *         description: End date for report (YYYY-MM-DD)
     *       - in: query
     *         name: groupBy
     *         schema:
     *           type: string
     *           enum: [day, week, month, year]
     *         description: Group results by time period
     *     responses:
     *       200:
     *         description: Report of income vs expenses
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     */
    this.router.get('/income-vs-expenses', this.controller.getIncomeVsExpenses);

    /**
     * @swagger
     * /reports/monthly-trend:
     *   get:
     *     summary: Get monthly spending trend
     *     tags: [Reports]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: months
     *         schema:
     *           type: integer
     *         description: Number of months to include in the trend (default 6)
     *     responses:
     *       200:
     *         description: Monthly spending trend report
     *       401:
     *         description: Unauthorized
     */
    this.router.get('/monthly-trend', this.controller.getMonthlyTrend);
  }
}

export default ReportsRouter;
