import type { NextFunction, Request, Response } from 'express';

export interface CrudController {
  getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
  getById(req: Request, res: Response, next: NextFunction): Promise<void>;
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  delete(req: Request, res: Response, next: NextFunction): Promise<void>;
  restore(req: Request, res: Response, next: NextFunction): Promise<void>;
  getDeleted(req: Request, res: Response, next: NextFunction): Promise<void>;
  getAllAdmin(req: Request, res: Response, next: NextFunction): Promise<void>;
  getByIdAdmin(req: Request, res: Response, next: NextFunction): Promise<void>;
  createAdmin(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateAdmin(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteAdmin(req: Request, res: Response, next: NextFunction): Promise<void>;
  restoreAdmin(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export interface AccountController extends CrudController {
  toggleActive(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateBalance(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export interface TransactionController extends CrudController {
  getByAccount(req: Request, res: Response, next: NextFunction): Promise<void>;
  getByCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export interface CategoryController extends CrudController {
  getByType(req: Request, res: Response, next: NextFunction): Promise<void>;
}   

export interface BudgetController extends CrudController {
  getByPeriod(req: Request, res: Response, next: NextFunction): Promise<void>;
  getByCategoryType(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCurrent(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export interface UserController extends CrudController {}

export interface AuthController {
  register(req: Request, res: Response, next: NextFunction): Promise<void>;
  login(req: Request, res: Response, next: NextFunction): Promise<void>;
  logout(req: Request, res: Response, next: NextFunction): Promise<void>;
  changePassword(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export interface ReportsController {
  getSpendingByCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
  getIncomeVsExpenses(req: Request, res: Response, next: NextFunction): Promise<void>;
  getMonthlyTrend(req: Request, res: Response, next: NextFunction): Promise<void>;  
}



