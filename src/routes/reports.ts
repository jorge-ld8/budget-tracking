import { authenticate } from '../middlewares/auth.ts';
import type { ReportsController } from '../types/controllers.ts';
import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.ts';
import { incomeVsExpensesSchema, monthlyTrendSchema, spendingByCategorySchema } from '../validators/reports.validator.ts';
import { z } from 'zod';

class ReportsRouter{
  private readonly router: Router;
  private readonly controller: ReportsController;

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
    this.router.get('/spending-by-category', 
      validateRequest(z.object({ query: spendingByCategorySchema })) as any, 
      this.controller.getSpendingByCategory);

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
    this.router.get('/income-vs-expenses', 
      validateRequest(z.object({ query: incomeVsExpensesSchema })) as any, 
      this.controller.getIncomeVsExpenses);

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
    this.router.get('/monthly-trend', 
      validateRequest(z.object({ query: monthlyTrendSchema })) as any, 
      this.controller.getMonthlyTrend);
  }
}

export default ReportsRouter;
