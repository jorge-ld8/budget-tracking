class BaseController {
  constructor(service) {
    this.service = service;
  }

  // Common CRUD operations that should be implemented by subclasses
  async getAll(req, res, next) {
    throw new Error('Method getAll() must be implemented');
  }

  async getById(req, res, next) {
    throw new Error('Method getById() must be implemented');
  }

  async create(req, res, next) {
    throw new Error('Method create() must be implemented');
  }

  async update(req, res, next) {
    throw new Error('Method update() must be implemented');
  }

  async delete(req, res, next) {
    throw new Error('Method delete() must be implemented');
  }

  // Error handling helper
  handleError(res, error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

module.exports = BaseController; 