import { CustomError } from './CustomError';
import { StatusCodes } from 'http-status-codes';

/**
 * Error for authorization failures (HTTP 403)
 */
class ForbiddenError extends CustomError {
  constructor(message: string) {
    super(message || 'Forbidden');
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

export { ForbiddenError }; 
