/**
 * Custom Error Classes
 *
 * Application-specific errors for consistent error handling.
 */
import { ZodError } from 'zod';
export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: Record<string, string[]> | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: Record<string, string[]> | undefined);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, identifier?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, details?: Record<string, string[]>);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string, zodErrorOrDetails?: ZodError | Record<string, string[]>);
}
export declare class BusinessRuleError extends AppError {
    constructor(message: string, details?: Record<string, string[]>);
}
//# sourceMappingURL=errors.d.ts.map