"use strict";
/**
 * Custom Error Classes
 *
 * Application-specific errors for consistent error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleError = exports.ValidationError = exports.ForbiddenError = exports.UnauthorizedError = exports.ConflictError = exports.NotFoundError = exports.AppError = void 0;
const zod_1 = require("zod");
class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource, identifier) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super('NOT_FOUND', message, 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message, details) {
        super('CONFLICT', message, 409, details);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super('UNAUTHORIZED', message, 401);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super('FORBIDDEN', message, 403);
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
class ValidationError extends AppError {
    constructor(message, zodErrorOrDetails) {
        let details;
        if (zodErrorOrDetails instanceof zod_1.ZodError) {
            // Convert ZodError to details format
            details = {};
            for (const issue of zodErrorOrDetails.issues) {
                const path = issue.path.join('.') || 'root';
                if (!details[path]) {
                    details[path] = [];
                }
                details[path].push(issue.message);
            }
        }
        else {
            details = zodErrorOrDetails;
        }
        super('VALIDATION_ERROR', message, 400, details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class BusinessRuleError extends AppError {
    constructor(message, details) {
        super('UNPROCESSABLE', message, 422, details);
        this.name = 'BusinessRuleError';
    }
}
exports.BusinessRuleError = BusinessRuleError;
//# sourceMappingURL=errors.js.map