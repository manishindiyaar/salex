/**
 * Customer Zod Schemas
 */
import { z } from 'zod';
export declare const createCustomerSchema: z.ZodObject<{
    phoneNumber: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phoneNumber: string;
    name?: string | undefined;
}, {
    phoneNumber: string;
    name?: string | undefined;
}>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export declare const updateCustomerSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    isBlocked: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    isBlocked?: boolean | undefined;
}, {
    name?: string | undefined;
    isBlocked?: boolean | undefined;
}>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export declare const upsertCustomerSchema: z.ZodObject<{
    phoneNumber: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phoneNumber: string;
    name?: string | undefined;
}, {
    phoneNumber: string;
    name?: string | undefined;
}>;
export type UpsertCustomerInput = z.infer<typeof upsertCustomerSchema>;
