import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

export function validate<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: result.error,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: result.error,
      });
      return;
    }
    Object.defineProperty(req, 'query', {
      value: result.data,
      enumerable: true,
      writable: true,
      configurable: true,
    });
    next();
  };
}
