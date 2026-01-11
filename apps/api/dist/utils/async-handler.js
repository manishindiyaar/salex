"use strict";
/**
 * Async Handler Utility
 *
 * Wraps async route handlers to catch errors and pass them to Express error middleware.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
/**
 * Wraps an async function to catch errors and pass them to next()
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=async-handler.js.map