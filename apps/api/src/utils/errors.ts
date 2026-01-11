/**
 * Custom Error Classes
 * 
 * Application-specific errors for consistent error handling.
 */

import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super('CONFLICT', message, 409, details);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, zodErrorOrDetails?: ZodError | Record<string, string[]>) {
    let details: Record<string, string[]> | undefined;
    
    if (zodErrorOrDetails instanceof ZodError) {
      // Convert ZodError to details format
      details = {};
      for (const issue of zodErrorOrDetails.issues) {
        const path = issue.path.join('.') || 'root';
        if (!details[path]) {
          details[path] = [];
        }
        details[path].push(issue.message);
      }
    } else {
      details = zodErrorOrDetails;
    }
    
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super('UNPROCESSABLE', message, 422, details);
    this.name = 'BusinessRuleError';
  }
}
