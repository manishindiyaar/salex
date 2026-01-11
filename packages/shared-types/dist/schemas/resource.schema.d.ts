/**
 * Resource Management Zod Schemas
 *
 * Schemas for physical bookable resources (chairs, beds, rooms, stations)
 */
import { z } from 'zod';
export declare const createResourceSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    displayOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    displayOrder: number;
    name?: string | undefined;
    description?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    displayOrder?: number | undefined;
}>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export declare const bulkResourceItemSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    isActive?: boolean | undefined;
    displayOrder?: number | undefined;
}, {
    name: string;
    description?: string | undefined;
    isActive?: boolean | undefined;
    displayOrder?: number | undefined;
}>;
export declare const bulkCreateResourceSchema: z.ZodUnion<[z.ZodObject<{
    count: z.ZodNumber;
    prefix: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    count: number;
    prefix: string;
}, {
    count: number;
    prefix?: string | undefined;
}>, z.ZodObject<{
    resources: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        displayOrder: z.ZodOptional<z.ZodNumber>;
        isActive: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description?: string | undefined;
        isActive?: boolean | undefined;
        displayOrder?: number | undefined;
    }, {
        name: string;
        description?: string | undefined;
        isActive?: boolean | undefined;
        displayOrder?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    resources: {
        name: string;
        description?: string | undefined;
        isActive?: boolean | undefined;
        displayOrder?: number | undefined;
    }[];
}, {
    resources: {
        name: string;
        description?: string | undefined;
        isActive?: boolean | undefined;
        displayOrder?: number | undefined;
    }[];
}>]>;
export type BulkCreateResourceInput = z.infer<typeof bulkCreateResourceSchema>;
export declare const updateResourceSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | null | undefined;
    displayOrder?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | null | undefined;
    displayOrder?: number | undefined;
}>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export declare const resourceIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type ResourceIdInput = z.infer<typeof resourceIdSchema>;
export declare const resourceListQuerySchema: z.ZodObject<{
    businessId: z.ZodString;
    includeInactive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    businessId: string;
    includeInactive: boolean;
}, {
    businessId: string;
    includeInactive?: boolean | undefined;
}>;
export type ResourceListQueryInput = z.infer<typeof resourceListQuerySchema>;
export declare const resourceResponseSchema: z.ZodObject<{
    id: z.ZodString;
    businessId: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    displayOrder: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string | null;
    isActive: boolean;
    id: string;
    businessId: string;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}, {
    name: string;
    description: string | null;
    isActive: boolean;
    id: string;
    businessId: string;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}>;
export type ResourceResponse = z.infer<typeof resourceResponseSchema>;
export declare const resourceWithStatsSchema: z.ZodObject<{
    id: z.ZodString;
    businessId: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    displayOrder: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
} & {
    utilizationPercent: z.ZodNumber;
    activeBookingsCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string | null;
    isActive: boolean;
    id: string;
    businessId: string;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
    utilizationPercent: number;
    activeBookingsCount: number;
}, {
    name: string;
    description: string | null;
    isActive: boolean;
    id: string;
    businessId: string;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
    utilizationPercent: number;
    activeBookingsCount: number;
}>;
export type ResourceWithStats = z.infer<typeof resourceWithStatsSchema>;
