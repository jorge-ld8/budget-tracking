const CustomError = require('./CustomError');
const { StatusCodes } = require('http-status-codes');
/**
 * Error for resources that cannot be found (HTTP 404)
 */
class NotFoundError extends CustomError {
  constructor(message) {
    super(message || 'Resource not found');
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

module.exports = NotFoundError; 