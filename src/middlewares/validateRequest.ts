import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
// import { BadRequestError } from '../errors/index.ts';

export const validateRequest = (schema: z.AnyZodObject): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse relevant parts of the request against the schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      // if (error instanceof ZodError) {
      //   console.log("ZodError ", error);
      //   const formattedErrors = error.errors.map((err) => ({
      //     path: err.path.join('.'),
      //     message: err.message,
      //   }));
      //   // Create a proper error instead of returning a response
      //   const validationError = new BadRequestError(`Validation failed: ${formattedErrors.map(e => e.message).join(', ')}`);
      //   (validationError as any).errors = formattedErrors;
      //   next(validationError);
      // } else {
        next(error);
      // }
    }
  };
