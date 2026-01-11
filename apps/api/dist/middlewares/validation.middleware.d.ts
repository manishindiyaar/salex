/**
 * Validation Middleware
 *
 * Zod schema validation for request body, query, and params.
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
type ValidationTarget = 'body' | 'query' | 'params';
/**
 * Create validation middleware for a Zod schema
 */
export declare function validate(schema: ZodSchema, target?: ValidationTarget): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Validate request body
 */
export declare function validateBody(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Validate query parameters
 */
export declare function validateQuery(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Validate route parameters
 */
export declare function validateParams(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validation.middleware.d.ts.map