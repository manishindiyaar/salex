/**
 * Zod Error Formatter
 * 
 * Converts Zod validation errors into a user-friendly format.
 */

import { ZodError, ZodIssue } from 'zod';

export interface FormattedZodError {
  [field: string]: string[];
}

/**
 * Format Zod validation errors into field-level error messages
 */
export function formatZodErrors(error: ZodError): FormattedZodError {
  const formatted: FormattedZodError = {};

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
function formatIssueMessage(issue: ZodIssue): string {
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
export function getZodErrorMessages(error: ZodError): string[] {
  return error.issues.map(issue => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${formatIssueMessage(issue)}`;
  });
}

/**
 * Get the first error message (useful for simple error display)
 */
export function getFirstZodError(error: ZodError): string | null {
  const messages = getZodErrorMessages(error);
  return messages.length > 0 ? messages[0] : null;
}
