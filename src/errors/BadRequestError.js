const CustomError = require('./CustomError');
const { StatusCodes } = require('http-status-codes');
/**
 * Error for invalid request parameters or payload (HTTP 400)
 */
class BadRequestError extends CustomError {
  constructor(message) {
    super(message || 'Bad request');
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

module.exports = BadRequestError; 