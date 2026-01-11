"use strict";
/**
 * Booking Zod Schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickBookSchema = exports.bookingAllocationSchema = exports.updateAllocationSchema = exports.availabilityCheckSchema = exports.bookingListQuerySchema = exports.checkoutSchema = exports.bookingStatusTransitions = exports.updateBookingStatusSchema = exports.createBookingSchema = exports.paymentModeSchema = exports.bookingStatusSchema = void 0;
const zod_1 = require("zod");
// Booking status enum
exports.bookingStatusSchema = zod_1.z.enum([
    'PENDING',
    'CONFIRMED',
    'REJECTED',
    'CANCELLED_BY_USER',
    'CANCELLED_BY_SALON',
    'COMPLETED',
]);
// Payment mode enum
exports.paymentModeSchema = zod_1.z.enum(['CASH', 'UPI', 'OTHER']);
// Booking creation with multi-service support (combos) and optional allocation
exports.createBookingSchema = zod_1.z.object({
    businessId: zod_1.z.string().cuid(),
    customerId: zod_1.z.string().cuid().optional().nullable(), // Optional for walk-ins
    serviceIds: zod_1.z.array(zod_1.z.string().cuid()).min(1).max(10),
    scheduledAt: zod_1.z.string().datetime(),
    notes: zod_1.z.string().max(500).optional(),
    source: zod_1.z.enum(['whatsapp', 'manual', 'walk-in']).optional(),
    // Optional resource/staff allocation (auto-assigned if not provided)
    resourceId: zod_1.z.string().cuid().optional(),
    staffId: zod_1.z.string().cuid().optional(),
    // Customer preference for staff (used in auto-assignment)
    preferredStaffId: zod_1.z.string().cuid().optional(),
});
// Booking status update
exports.updateBookingStatusSchema = zod_1.z.object({
    status: exports.bookingStatusSchema,
});
// Booking status transition validation
exports.bookingStatusTransitions = {
    PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
    CONFIRMED: ['COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
    REJECTED: [],
    CANCELLED_BY_USER: [],
    CANCELLED_BY_SALON: [],
    COMPLETED: [],
};
// Checkout item schema
const checkoutItemSchema = zod_1.z.object({
    serviceId: zod_1.z.string().cuid(),
    quantity: zod_1.z.number().int().min(1).default(1),
});
// Checkout schema (dynamic item modification at completion)
exports.checkoutSchema = zod_1.z.object({
    items: zod_1.z.array(checkoutItemSchema).min(1),
    paymentMode: exports.paymentModeSchema,
});
// Booking list query
exports.bookingListQuerySchema = zod_1.z.object({
    businessId: zod_1.z.string().cuid(),
    status: exports.bookingStatusSchema.optional(),
    from: zod_1.z.string().datetime().optional(),
    to: zod_1.z.string().datetime().optional(),
    page: zod_1.z.number().int().min(1).default(1),
    pageSize: zod_1.z.number().int().min(1).max(100).default(20),
});
// Availability check
exports.availabilityCheckSchema = zod_1.z.object({
    businessId: zod_1.z.string().cuid(),
    scheduledAt: zod_1.z.string().datetime(),
    durationMinutes: zod_1.z.number().int().min(5),
});
// Allocation update schema (change resource/staff on existing booking)
exports.updateAllocationSchema = zod_1.z.object({
    resourceId: zod_1.z.string().cuid().optional(),
    staffId: zod_1.z.string().cuid().optional(),
});
// Booking response with allocation info
exports.bookingAllocationSchema = zod_1.z.object({
    resourceId: zod_1.z.string().cuid().nullable(),
    resourceName: zod_1.z.string().nullable(),
    staffId: zod_1.z.string().cuid().nullable(),
    staffName: zod_1.z.string().nullable(),
});
// Quick book schema (one-tap booking with auto-assignment)
exports.quickBookSchema = zod_1.z.object({
    businessId: zod_1.z.string().cuid(),
    serviceIds: zod_1.z.array(zod_1.z.string().cuid()).min(1).max(10),
    scheduledAt: zod_1.z.string().datetime(),
    customerId: zod_1.z.string().cuid().optional(),
    notes: zod_1.z.string().max(500).optional(),
});
