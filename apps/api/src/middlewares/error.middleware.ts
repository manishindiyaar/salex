/**
 * Global Error Handler Middleware
 * 
 * Converts errors to consistent API responses with correlation IDs.
 */

import { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { formatZodErrors, ApiResponse } from '@salex/shared-types';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

// Prisma error type check helper
interface PrismaError extends Error {
  code?: string;
  meta?: { target?: string[] };
}

function isPrismaError(error: unknown): error is PrismaError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as PrismaError).code === 'string'
  );
}

export const errorMiddleware: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

  // Log the error
  logger.error({
    correlationId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Zod validation error
  if (err instanceof ZodError) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: formatZodErrors(err),
        correlationId,
      },
    };
    res.status(400).json(response);
    return;
  }

  // Custom application error
  if (err instanceof AppError) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        correlationId,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Prisma unique constraint violation
  if (isPrismaError(err)) {
    if (err.code === 'P2002') {
      const target = err.meta?.target?.join(', ') || 'field';
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'CONFLICT',
          message: `A record with this ${target} already exists`,
          correlationId,
        },
      };
      res.status(409).json(response);
      return;
    }

    if (err.code === 'P2025') {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
          correlationId,
        },
      };
      res.status(404).json(response);
      return;
    }
  }

  // Default: Internal server error (don't expose details)
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      correlationId,
    },
  };
  res.status(500).json(response);
};
