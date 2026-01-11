/**
 * Zod Error Formatter
 *
 * Converts Zod validation errors into a user-friendly format.
 */
import { ZodError } from 'zod';
export interface FormattedZodError {
    [field: string]: string[];
}
/**
 * Format Zod validation errors into field-level error messages
 */
export declare function formatZodErrors(error: ZodError): FormattedZodError;
/**
 * Get a flat list of all error messages
 */
export declare function getZodErrorMessages(error: ZodError): string[];
/**
 * Get the first error message (useful for simple error display)
 */
export declare function getFirstZodError(error: ZodError): string | null;
