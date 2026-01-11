/**
 * Staff Management Zod Schemas
 *
 * Schemas for staff members who perform services
 */
import { z } from 'zod';
export declare const createStaffSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    linkedResourceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone?: string | undefined;
    linkedResourceIds?: string[] | undefined;
}, {
    name: string;
    phone?: string | undefined;
    linkedResourceIds?: string[] | undefined;
}>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export declare const updateStaffSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    phone?: string | null | undefined;
    name?: string | undefined;
}, {
    phone?: string | null | undefined;
    name?: string | undefined;
}>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export declare const staffIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type StaffIdInput = z.infer<typeof staffIdSchema>;
export declare const staffListQuerySchema: z.ZodObject<{
    businessId: z.ZodString;
    includeInactive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    businessId: string;
    includeInactive: boolean;
}, {
    businessId: string;
    includeInactive?: boolean | undefined;
}>;
export type StaffListQueryInput = z.infer<typeof staffListQuerySchema>;
export declare const linkResourceSchema: z.ZodObject<{
    resourceId: z.ZodString;
    isPrimary: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    resourceId: string;
    isPrimary: boolean;
}, {
    resourceId: string;
    isPrimary?: boolean | undefined;
}>;
export type LinkResourceInput = z.infer<typeof linkResourceSchema>;
export declare const staffResponseSchema: z.ZodObject<{
    id: z.ZodString;
    businessId: z.ZodString;
    name: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    phone: string | null;
    name: string;
    isActive: boolean;
    id: string;
    businessId: string;
    createdAt: Date;
    updatedAt: Date;
}, {
    phone: string | null;
    name: string;
    isActive: boolean;
    id: string;
    businessId: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export type StaffResponse = z.infer<typeof staffResponseSchema>;
export declare const linkedResourceSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    isPrimary: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    isPrimary: boolean;
}, {
    name: string;
    id: string;
    isPrimary: boolean;
}>;
export type LinkedResource = z.infer<typeof linkedResourceSchema>;
export declare const staffWithStatsSchema: z.ZodObject<{
    id: z.ZodString;
    businessId: z.ZodString;
    name: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
} & {
    linkedResources: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        isPrimary: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        isPrimary: boolean;
    }, {
        name: string;
        id: string;
        isPrimary: boolean;
    }>, "many">;
    utilizationPercent: z.ZodNumber;
    activeBookingsCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    phone: string | null;
    name: string;
    isActive: boolean;
    id: string;
    businessId: string;
    createdAt: Date;
    updatedAt: Date;
    utilizationPercent: number;
    activeBookingsCount: number;
    linkedResources: {
        name: string;
        id: string;
        isPrimary: boolean;
    }[];
}, {
    phone: string | null;
    name: string;
    isActive: boolean;
    id: string;
    businessId: string;
    createdAt: Date;
    updatedAt: Date;
    utilizationPercent: number;
    activeBookingsCount: number;
    linkedResources: {
        name: string;
        id: string;
        isPrimary: boolean;
    }[];
}>;
export type StaffWithStats = z.infer<typeof staffWithStatsSchema>;
