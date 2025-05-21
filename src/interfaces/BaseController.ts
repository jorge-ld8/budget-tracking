import type { NextFunction, Request, Response } from "express";

class BaseController<T>{
  protected service: T;

  constructor(service: T) {
    this.service = service;
  }

  // Common CRUD operations that should be implemented by subclasses
  async getAll(req: Request, res: Response, next: NextFunction) {
    throw new Error('Method getAll() must be implemented');
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    throw new Error('Method getById() must be implemented');
  }

  async create(req: Request, res: Response, next: NextFunction) {
    throw new Error('Method create() must be implemented');
  }

  async update(req: Request, res: Response, next: NextFunction) {
    throw new Error('Method update() must be implemented');
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    throw new Error('Method delete() must be implemented');
  }

  async restore(req: Request, res: Response, next: NextFunction) {
    throw new Error('Method restore() must be implemented');
  }

  async getDeleted(req: Request, res: Response, next: NextFunction) {
    throw new Error('Method getDeleted() must be implemented');
  }

  // Error handling helper
  handleError(res: Response, error: Error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

export { BaseController }; 
