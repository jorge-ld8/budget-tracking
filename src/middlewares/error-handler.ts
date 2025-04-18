import { CustomError } from '../errors/index.ts';
import { StatusCodes } from 'http-status-codes';
import type { Request, Response, NextFunction } from 'express';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error', error: err.message });
};

export default errorHandler;

