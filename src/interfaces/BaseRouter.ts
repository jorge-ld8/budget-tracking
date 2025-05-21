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

  public getRouter() : Router {
    return this.router;
  }
}

export { BaseRouter }; 