const CustomError = require('./CustomError');
const { StatusCodes } = require('http-status-codes');
/**
 * Error for authentication failures (HTTP 401)
 */
class UnauthorizedError extends CustomError {
  constructor(message) {
    super(message || 'Unauthorized access');
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

module.exports = UnauthorizedError; 