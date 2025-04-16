import { CustomError } from './CustomError.ts';
import { StatusCodes } from 'http-status-codes';
/**
 * Error for invalid request parameters or payload (HTTP 400)
 */
class BadRequestError extends CustomError {
  constructor(message: string) {
    super(message || 'Bad request');
    this.statusCode = StatusCodes.BAD_REQUEST;
  } 
}

export { BadRequestError }; 
