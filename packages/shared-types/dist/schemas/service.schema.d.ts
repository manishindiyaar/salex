/**
 * Service Catalog Zod Schemas
 */
import { z } from 'zod';
export declare const createServiceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    durationMinutes: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    durationMinutes: number;
    isActive: boolean;
    description?: string | undefined;
}, {
    name: string;
    price: number;
    description?: string | undefined;
    durationMinutes?: number | undefined;
    isActive?: boolean | undefined;
}>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export declare const updateServiceSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodNumber>;
    durationMinutes: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | null | undefined;
    price?: number | undefined;
    durationMinutes?: number | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | null | undefined;
    price?: number | undefined;
    durationMinutes?: number | undefined;
    isActive?: boolean | undefined;
}>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export declare const serviceIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type ServiceIdInput = z.infer<typeof serviceIdSchema>;
export declare const serviceListQuerySchema: z.ZodObject<{
    businessId: z.ZodString;
    includeInactive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    businessId: string;
    includeInactive: boolean;
}, {
    businessId: string;
    includeInactive?: boolean | undefined;
}>;
export type ServiceListQueryInput = z.infer<typeof serviceListQuerySchema>;
