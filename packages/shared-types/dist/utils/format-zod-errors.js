"use strict";
/**
 * Zod Error Formatter
 *
 * Converts Zod validation errors into a user-friendly format.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatZodErrors = formatZodErrors;
exports.getZodErrorMessages = getZodErrorMessages;
exports.getFirstZodError = getFirstZodError;
/**
 * Format Zod validation errors into field-level error messages
 */
function formatZodErrors(error) {
    const formatted = {};
    for (const issue of error.issues) {
        const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
        if (!formatted[path]) {
            formatted[path] = [];
        }
        formatted[path].push(formatIssueMessage(issue));
    }
    return formatted;
}
/**
 * Format a single Zod issue into a human-readable message
 */
function formatIssueMessage(issue) {
    switch (issue.code) {
        case 'invalid_type':
            return `Expected ${issue.expected}, received ${issue.received}`;
        case 'invalid_string':
            if (issue.validation === 'regex') {
                return issue.message || 'Invalid format';
            }
            return `Invalid ${issue.validation}`;
        case 'too_small':
            if (issue.type === 'string') {
                return `Must be at least ${issue.minimum} characters`;
            }
            if (issue.type === 'array') {
                return `Must have at least ${issue.minimum} items`;
            }
            return `Must be at least ${issue.minimum}`;
        case 'too_big':
            if (issue.type === 'string') {
                return `Must be at most ${issue.maximum} characters`;
            }
            if (issue.type === 'array') {
                return `Must have at most ${issue.maximum} items`;
            }
            return `Must be at most ${issue.maximum}`;
        case 'invalid_enum_value':
            return `Must be one of: ${issue.options.join(', ')}`;
        case 'custom':
            return issue.message || 'Invalid value';
        default:
            return issue.message || 'Invalid value';
    }
}
/**
 * Get a flat list of all error messages
 */
function getZodErrorMessages(error) {
    return error.issues.map(issue => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${formatIssueMessage(issue)}`;
    });
}
/**
 * Get the first error message (useful for simple error display)
 */
function getFirstZodError(error) {
    const messages = getZodErrorMessages(error);
    return messages.length > 0 ? messages[0] : null;
}
