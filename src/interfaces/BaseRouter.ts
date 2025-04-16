import { Router } from 'express';
import type { CrudController } from '../types/controllers.ts';

class BaseRouter<T extends CrudController> {
  protected router: Router;
  protected controller: T;

  constructor(controller: T) {
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