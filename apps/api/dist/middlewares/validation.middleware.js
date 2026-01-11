"use strict";
/**
 * Validation Middleware
 *
 * Zod schema validation for request body, query, and params.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
/**
 * Create validation middleware for a Zod schema
 */
function validate(schema, target = 'body') {
    return (req, _res, next) => {
        try {
            const data = req[target];
            const parsed = schema.parse(data);
            // Replace with parsed (and transformed) data
            req[target] = parsed;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Validate request body
 */
function validateBody(schema) {
    return validate(schema, 'body');
}
/**
 * Validate query parameters
 */
function validateQuery(schema) {
    return validate(schema, 'query');
}
/**
 * Validate route parameters
 */
function validateParams(schema) {
    return validate(schema, 'params');
}
//# sourceMappingURL=validation.middleware.js.map