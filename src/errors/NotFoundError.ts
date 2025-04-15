import { CustomError } from './CustomError';
import { StatusCodes } from 'http-status-codes';
/**
 * Error for resources that cannot be found (HTTP 404)
 */
class NotFoundError extends CustomError {
  constructor(message: string) {
    super(message || 'Resource not found');
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

export { NotFoundError }; 
