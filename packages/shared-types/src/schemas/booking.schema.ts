/**
 * Booking Zod Schemas
 */

import { z } from 'zod';

// Booking status enum
export const bookingStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'REJECTED',
  'CANCELLED_BY_USER',
  'CANCELLED_BY_SALON',
  'COMPLETED',
]);

export type BookingStatusType = z.infer<typeof bookingStatusSchema>;

// Payment mode enum
export const paymentModeSchema = z.enum(['CASH', 'UPI', 'OTHER']);

export type PaymentModeType = z.infer<typeof paymentModeSchema>;

// Booking creation with multi-service support (combos) and optional allocation
export const createBookingSchema = z.object({
  businessId: z.string().cuid(),
  customerId: z.string().cuid().optional().nullable(), // Optional for walk-ins
  serviceIds: z.array(z.string().cuid()).min(1).max(10),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
  source: z.enum(['whatsapp', 'manual', 'walk-in']).optional(),
  // Optional resource/staff allocation (auto-assigned if not provided)
  resourceId: z.string().cuid().optional(),
  staffId: z.string().cuid().optional(),
  // Customer preference for staff (used in auto-assignment)
  preferredStaffId: z.string().cuid().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// Booking status update
export const updateBookingStatusSchema = z.object({
  status: bookingStatusSchema,
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

// Booking status transition validation
export const bookingStatusTransitions: Record<BookingStatusType, BookingStatusType[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
  CONFIRMED: ['COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
  REJECTED: [],
  CANCELLED_BY_USER: [],
  CANCELLED_BY_SALON: [],
  COMPLETED: [],
};

// Checkout item schema
const checkoutItemSchema = z.object({
  serviceId: z.string().cuid(),
  quantity: z.number().int().min(1).default(1),
});

// Checkout schema (dynamic item modification at completion)
export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1),
  paymentMode: paymentModeSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Booking list query
export const bookingListQuerySchema = z.object({
  businessId: z.string().cuid(),
  status: bookingStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type BookingListQueryInput = z.infer<typeof bookingListQuerySchema>;

// Availability check
export const availabilityCheckSchema = z.object({
  businessId: z.string().cuid(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(5),
});

export type AvailabilityCheckInput = z.infer<typeof availabilityCheckSchema>;

// Allocation update schema (change resource/staff on existing booking)
export const updateAllocationSchema = z.object({
  resourceId: z.string().cuid().optional(),
  staffId: z.string().cuid().optional(),
});

export type UpdateAllocationInput = z.infer<typeof updateAllocationSchema>;

// Booking response with allocation info
export const bookingAllocationSchema = z.object({
  resourceId: z.string().cuid().nullable(),
  resourceName: z.string().nullable(),
  staffId: z.string().cuid().nullable(),
  staffName: z.string().nullable(),
});

export type BookingAllocation = z.infer<typeof bookingAllocationSchema>;

// Quick book schema (one-tap booking with auto-assignment)
export const quickBookSchema = z.object({
  businessId: z.string().cuid(),
  serviceIds: z.array(z.string().cuid()).min(1).max(10),
  scheduledAt: z.string().datetime(),
  customerId: z.string().cuid().optional(),
  notes: z.string().max(500).optional(),
});

export type QuickBookInput = z.infer<typeof quickBookSchema>;
