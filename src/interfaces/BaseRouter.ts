import { Router } from 'express';
import { BaseController } from './BaseController';

class BaseRouter {
  protected router: Router;
  protected controller: BaseController;

  constructor(controller: BaseController) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  initializeRoutes() {
    throw new Error('Method initializeRoutes() must be implemented');
  }

  applyMiddleware(middleware: any) {
    this.router.use(middleware);
    return this;
  }

  getRouter() {
    return this.router;
  }
}

export { BaseRouter }; 