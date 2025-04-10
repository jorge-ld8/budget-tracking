const express = require('express');

class BaseRouter {
  constructor(controller) {
    this.router = express.Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  // To be implemented by child classes
  initializeRoutes() {
    throw new Error('Method initializeRoutes() must be implemented');
  }

  // Common middleware for this router
  applyMiddleware(middleware) {
    this.router.use(middleware);
    return this;
  }

  // Return the configured router
  getRouter() {
    return this.router;
  }
}

module.exports = BaseRouter; 