/**
 * Booking Zod Schemas
 */
import { z } from 'zod';
export declare const bookingStatusSchema: z.ZodEnum<["PENDING", "CONFIRMED", "REJECTED", "CANCELLED_BY_USER", "CANCELLED_BY_SALON", "COMPLETED"]>;
export type BookingStatusType = z.infer<typeof bookingStatusSchema>;
export declare const paymentModeSchema: z.ZodEnum<["CASH", "UPI", "OTHER"]>;
export type PaymentModeType = z.infer<typeof paymentModeSchema>;
export declare const createBookingSchema: z.ZodObject<{
    businessId: z.ZodString;
    customerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    serviceIds: z.ZodArray<z.ZodString, "many">;
    scheduledAt: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodEnum<["whatsapp", "manual", "walk-in"]>>;
    resourceId: z.ZodOptional<z.ZodString>;
    staffId: z.ZodOptional<z.ZodString>;
    preferredStaffId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    businessId: string;
    serviceIds: string[];
    scheduledAt: string;
    customerId?: string | null | undefined;
    notes?: string | undefined;
    source?: "whatsapp" | "manual" | "walk-in" | undefined;
    resourceId?: string | undefined;
    staffId?: string | undefined;
    preferredStaffId?: string | undefined;
}, {
    businessId: string;
    serviceIds: string[];
    scheduledAt: string;
    customerId?: string | null | undefined;
    notes?: string | undefined;
    source?: "whatsapp" | "manual" | "walk-in" | undefined;
    resourceId?: string | undefined;
    staffId?: string | undefined;
    preferredStaffId?: string | undefined;
}>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export declare const updateBookingStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING", "CONFIRMED", "REJECTED", "CANCELLED_BY_USER", "CANCELLED_BY_SALON", "COMPLETED"]>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED_BY_USER" | "CANCELLED_BY_SALON" | "COMPLETED";
}, {
    status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED_BY_USER" | "CANCELLED_BY_SALON" | "COMPLETED";
}>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export declare const bookingStatusTransitions: Record<BookingStatusType, BookingStatusType[]>;
export declare const checkoutSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        serviceId: z.ZodString;
        quantity: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        serviceId: string;
        quantity: number;
    }, {
        serviceId: string;
        quantity?: number | undefined;
    }>, "many">;
    paymentMode: z.ZodEnum<["CASH", "UPI", "OTHER"]>;
}, "strip", z.ZodTypeAny, {
    items: {
        serviceId: string;
        quantity: number;
    }[];
    paymentMode: "OTHER" | "CASH" | "UPI";
}, {
    items: {
        serviceId: string;
        quantity?: number | undefined;
    }[];
    paymentMode: "OTHER" | "CASH" | "UPI";
}>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export declare const bookingListQuerySchema: z.ZodObject<{
    businessId: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["PENDING", "CONFIRMED", "REJECTED", "CANCELLED_BY_USER", "CANCELLED_BY_SALON", "COMPLETED"]>>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    businessId: string;
    page: number;
    pageSize: number;
    status?: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED_BY_USER" | "CANCELLED_BY_SALON" | "COMPLETED" | undefined;
    from?: string | undefined;
    to?: string | undefined;
}, {
    businessId: string;
    status?: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED_BY_USER" | "CANCELLED_BY_SALON" | "COMPLETED" | undefined;
    from?: string | undefined;
    to?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}>;
export type BookingListQueryInput = z.infer<typeof bookingListQuerySchema>;
export declare const availabilityCheckSchema: z.ZodObject<{
    businessId: z.ZodString;
    scheduledAt: z.ZodString;
    durationMinutes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    durationMinutes: number;
    businessId: string;
    scheduledAt: string;
}, {
    durationMinutes: number;
    businessId: string;
    scheduledAt: string;
}>;
export type AvailabilityCheckInput = z.infer<typeof availabilityCheckSchema>;
export declare const updateAllocationSchema: z.ZodObject<{
    resourceId: z.ZodOptional<z.ZodString>;
    staffId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    resourceId?: string | undefined;
    staffId?: string | undefined;
}, {
    resourceId?: string | undefined;
    staffId?: string | undefined;
}>;
export type UpdateAllocationInput = z.infer<typeof updateAllocationSchema>;
export declare const bookingAllocationSchema: z.ZodObject<{
    resourceId: z.ZodNullable<z.ZodString>;
    resourceName: z.ZodNullable<z.ZodString>;
    staffId: z.ZodNullable<z.ZodString>;
    staffName: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    resourceId: string | null;
    staffId: string | null;
    resourceName: string | null;
    staffName: string | null;
}, {
    resourceId: string | null;
    staffId: string | null;
    resourceName: string | null;
    staffName: string | null;
}>;
export type BookingAllocation = z.infer<typeof bookingAllocationSchema>;
export declare const quickBookSchema: z.ZodObject<{
    businessId: z.ZodString;
    serviceIds: z.ZodArray<z.ZodString, "many">;
    scheduledAt: z.ZodString;
    customerId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    businessId: string;
    serviceIds: string[];
    scheduledAt: string;
    customerId?: string | undefined;
    notes?: string | undefined;
}, {
    businessId: string;
    serviceIds: string[];
    scheduledAt: string;
    customerId?: string | undefined;
    notes?: string | undefined;
}>;
export type QuickBookInput = z.infer<typeof quickBookSchema>;
