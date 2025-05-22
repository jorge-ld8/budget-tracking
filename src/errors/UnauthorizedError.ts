import { CustomError } from './CustomError.ts';
import { StatusCodes } from 'http-status-codes';
/**
 * Error for authentication failures (HTTP 401)
 */
class UnauthorizedError extends CustomError {
  constructor(message: string) {
    super(message || 'Unauthorized access');
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

export { UnauthorizedError }; 
