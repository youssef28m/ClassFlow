import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { Prisma } from '../../generated/prisma/client.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  const isOperational = error instanceof AppError;
  let statusCode = isOperational ? error.statusCode : 500;
  let message = isOperational ? error.message : 'Internal server error';

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }

  logger.error({ err: error, statusCode, method: req.method, url: req.originalUrl }, message);

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(env.NODE_ENV === 'production' ? {} : { stack: error instanceof Error ? error.stack : undefined }),
  });
}
