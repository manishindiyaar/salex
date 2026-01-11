"use strict";
/**
 * Global Error Handler Middleware
 *
 * Converts errors to consistent API responses with correlation IDs.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const shared_types_1 = require("@salex/shared-types");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
function isPrismaError(error) {
    return (error instanceof Error &&
        'code' in error &&
        typeof error.code === 'string');
}
const errorMiddleware = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) => {
    const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
    // Log the error
    logger_1.default.error({
        correlationId,
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    // Zod validation error
    if (err instanceof zod_1.ZodError) {
        const response = {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed',
                details: (0, shared_types_1.formatZodErrors)(err),
                correlationId,
            },
        };
        res.status(400).json(response);
        return;
    }
    // Custom application error
    if (err instanceof errors_1.AppError) {
        const response = {
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
            const response = {
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
            const response = {
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
    const response = {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            correlationId,
        },
    };
    res.status(500).json(response);
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map