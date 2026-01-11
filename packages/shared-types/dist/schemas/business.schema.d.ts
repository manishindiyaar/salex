/**
 * Business Zod Schemas
 */
import { z } from 'zod';
export declare const businessCategorySchema: z.ZodEnum<["SALON", "BEAUTY_PARLOR", "SPA", "CLINIC", "FITNESS", "OTHER"]>;
export type BusinessCategoryType = z.infer<typeof businessCategorySchema>;
export declare const createBusinessSchema: z.ZodObject<{
    name: z.ZodString;
    phoneNumber: z.ZodString;
    routingCode: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["SALON", "BEAUTY_PARLOR", "SPA", "CLINIC", "FITNESS", "OTHER"]>>;
    hoursOfOperation: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
        closed: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }>>>;
    maxConcurrentBookings: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isAcceptingOrders: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    phoneNumber: string;
    name: string;
    routingCode?: string | undefined;
    category?: "SALON" | "BEAUTY_PARLOR" | "SPA" | "CLINIC" | "FITNESS" | "OTHER" | undefined;
    hoursOfOperation?: Record<string, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }> | undefined;
    maxConcurrentBookings?: number | undefined;
    isAcceptingOrders?: boolean | undefined;
}, {
    phoneNumber: string;
    name: string;
    routingCode?: string | undefined;
    category?: "SALON" | "BEAUTY_PARLOR" | "SPA" | "CLINIC" | "FITNESS" | "OTHER" | undefined;
    hoursOfOperation?: Record<string, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }> | undefined;
    maxConcurrentBookings?: number | undefined;
    isAcceptingOrders?: boolean | undefined;
}>;
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type CreateBusinessRequest = CreateBusinessInput;
export declare const updateBusinessSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    routingCode: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["SALON", "BEAUTY_PARLOR", "SPA", "CLINIC", "FITNESS", "OTHER"]>>;
    hoursOfOperation: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
        closed: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }>>>;
    maxConcurrentBookings: z.ZodOptional<z.ZodNumber>;
    isAcceptingOrders: z.ZodOptional<z.ZodBoolean>;
    address: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phoneNumber?: string | undefined;
    name?: string | undefined;
    routingCode?: string | undefined;
    category?: "SALON" | "BEAUTY_PARLOR" | "SPA" | "CLINIC" | "FITNESS" | "OTHER" | undefined;
    hoursOfOperation?: Record<string, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }> | undefined;
    maxConcurrentBookings?: number | undefined;
    isAcceptingOrders?: boolean | undefined;
    address?: string | undefined;
}, {
    phoneNumber?: string | undefined;
    name?: string | undefined;
    routingCode?: string | undefined;
    category?: "SALON" | "BEAUTY_PARLOR" | "SPA" | "CLINIC" | "FITNESS" | "OTHER" | undefined;
    hoursOfOperation?: Record<string, {
        open: string;
        close: string;
        closed?: boolean | undefined;
    }> | undefined;
    maxConcurrentBookings?: number | undefined;
    isAcceptingOrders?: boolean | undefined;
    address?: string | undefined;
}>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type UpdateBusinessRequest = UpdateBusinessInput;
export declare const businessRoutingCodeSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
export type BusinessRoutingCodeInput = z.infer<typeof businessRoutingCodeSchema>;
/**
 * Helper function to format phone number to E.164 format
 * @param phone - Phone number in any format
 * @param countryCode - Country code (default: +91 for India)
 * @returns Phone number in E.164 format
 */
export declare function formatPhoneToE164(phone: string, countryCode?: string): string;
