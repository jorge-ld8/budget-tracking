import { StatusCodes } from 'http-status-codes';

// Base error class for application-specific errors
class CustomError {
  statusCode: number;
  message: string;
  name: string;

  constructor(message: string) {
    this.message = message;
    this.name = this.constructor.name;
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }
}

export { CustomError }; 
