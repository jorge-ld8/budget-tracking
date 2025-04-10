const CustomError = require('./CustomError');
const { StatusCodes } = require('http-status-codes');

/**
 * Error for authorization failures (HTTP 403)
 */
class ForbiddenError extends CustomError {
  constructor(message) {
    super(message || 'Forbidden');
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

module.exports = ForbiddenError; 