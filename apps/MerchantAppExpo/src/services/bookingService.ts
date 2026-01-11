/**
 * Booking Service
 * 
 * Handles all booking-related API calls to the Express.js backend.
 * 
 * Backend API Response Format: { success: boolean, data: { booking/bookings }, message?: string }
 * 
 * Endpoints:
 * - GET    /api/v1/bookings?businessId=xxx     - List bookings for business
 * - GET    /api/v1/bookings/:id                - Get single booking
 * - POST   /api/v1/bookings                    - Create booking
 * - PATCH  /api/v1/bookings/:id/status         - Update booking status (confirm, cancel, etc.)
 * - POST   /api/v1/bookings/:id/checkout       - Complete booking with payment
 */

import apiClient from './apiClient';
import {
  Booking,
  CreateBookingInput,
  BookingStatus,
} from '../types';

const BASE = '/bookings';

export interface ListBookingParams {
  page?: number;
  pageSize?: number;
  status?: BookingStatus;
  from?: string; // ISO datetime
  to?: string;   // ISO datetime
}

export type PaymentMode = 'CASH' | 'UPI' | 'OTHER';

export interface CheckoutItem {
  serviceId: string;
  quantity?: number;
}

export interface CheckoutPayload {
  items: CheckoutItem[];
  paymentMode: PaymentMode;
}

/**
 * Check if business has proper resource and staff setup for bookings
 * This prevents "slot unavailable" errors due to missing setup
 */
export async function validateBusinessSetup(businessId: string): Promise<{
  isValid: boolean;
  missingSetup: string[];
  message?: string;
}> {
  try {
    // Import here to avoid circular dependencies
    const { listResources } = await import('./resourceService');
    const { listStaff } = await import('./staffService');

    const [resources, staff] = await Promise.all([
      listResources(businessId, { includeInactive: false }),
      listStaff(businessId, { includeInactive: false }),
    ]);

    const missingSetup: string[] = [];
    
    if (!resources || resources.length === 0) {
      missingSetup.push('resources');
    }
    
    if (!staff || staff.length === 0) {
      missingSetup.push('staff');
    }

    const isValid = missingSetup.length === 0;
    
    return {
      isValid,
      missingSetup,
      message: isValid 
        ? undefined 
        : `Please set up ${missingSetup.join(' and ')} before creating bookings. This ensures proper capacity management and appointment allocation.`
    };
  } catch (error) {
    console.error('Failed to validate business setup:', error);
    return {
      isValid: false,
      missingSetup: ['validation_failed'],
      message: 'Unable to validate business setup. Please ensure resources and staff are configured.'
    };
  }
}

/**
 * Create a new booking with validation
 * POST /api/v1/bookings
 */
export async function createBooking(businessId: string, payload: CreateBookingInput): Promise<Booking> {
  // Validate business setup before creating booking
  const setupValidation = await validateBusinessSetup(businessId);
  
  if (!setupValidation.isValid) {
    throw new Error(setupValidation.message || 'Business setup incomplete');
  }

  // Clean payload - remove undefined values to avoid Zod validation errors
  // Zod doesn't like explicit undefined values, it expects fields to be omitted
  const cleanPayload: Record<string, any> = {
    businessId,
    serviceIds: payload.serviceIds,
    scheduledAt: payload.scheduledAt,
  };
  
  // Only add optional fields if they have actual values
  if (payload.customerId) cleanPayload.customerId = payload.customerId;
  if (payload.notes) cleanPayload.notes = payload.notes;
  if (payload.source) cleanPayload.source = payload.source;
  if (payload.resourceId) cleanPayload.resourceId = payload.resourceId;
  if (payload.staffId) cleanPayload.staffId = payload.staffId;
  if (payload.preferredStaffId) cleanPayload.preferredStaffId = payload.preferredStaffId;

  const res = await apiClient.post<any, typeof cleanPayload>(BASE, cleanPayload);
  // Backend returns { success, data: { booking }, message }
  // apiClient wraps in { data: response }, so we need res.data.data.booking
  return res.data?.data?.booking;
}

/**
 * Get a single booking by ID
 * GET /api/v1/bookings/:id
 */
export async function getBooking(id: string): Promise<Booking> {
  const res = await apiClient.get<any>(`${BASE}/${id}`);
  // apiClient wraps in { data: response }, so we need res.data.data.booking
  return res.data?.data?.booking;
}

/**
 * List bookings for a business
 * GET /api/v1/bookings?businessId=xxx&status=xxx&from=xxx&to=xxx
 */
export async function listBookingsByBusiness(
  businessId: string, 
  params: ListBookingParams = {}
): Promise<Booking[]> {
  const res = await apiClient.get<any>(BASE, { 
    params: { 
      businessId,
      ...params 
    } 
  });
  // Backend returns { success, data: { bookings }, meta }
  // apiClient wraps in { data: response }, so we need res.data.data.bookings
  const bookings = res.data?.data?.bookings || [];
  console.log('📚 listBookingsByBusiness:', bookings.length, 'bookings loaded');
  return bookings;
}

/**
 * Update booking status
 * PATCH /api/v1/bookings/:id/status
 * 
 * Valid status transitions:
 * - PENDING -> CONFIRMED, REJECTED, CANCELLED_BY_USER, CANCELLED_BY_SALON
 * - CONFIRMED -> COMPLETED, CANCELLED_BY_USER, CANCELLED_BY_SALON
 */
export async function updateBookingStatus(
  id: string, 
  status: BookingStatus
): Promise<Booking> {
  // Backend uses PATCH, not PUT
  const res = await apiClient.patch<any>(`${BASE}/${id}/status`, { status });
  // apiClient wraps in { data: response }, so we need res.data.data.booking
  return res.data?.data?.booking;
}

/**
 * Confirm a pending booking
 * PATCH /api/v1/bookings/:id/status with status: CONFIRMED
 */
export async function confirmBooking(id: string): Promise<Booking> {
  return updateBookingStatus(id, 'CONFIRMED' as BookingStatus);
}

/**
 * Cancel a booking (by salon)
 * PATCH /api/v1/bookings/:id/status with status: CANCELLED_BY_SALON
 */
export async function cancelBooking(id: string): Promise<Booking> {
  return updateBookingStatus(id, 'CANCELLED_BY_SALON' as BookingStatus);
}

/**
 * Reject a pending booking
 * PATCH /api/v1/bookings/:id/status with status: REJECTED
 */
export async function rejectBooking(id: string): Promise<Booking> {
  return updateBookingStatus(id, 'REJECTED' as BookingStatus);
}

/**
 * Complete a booking with checkout (payment)
 * POST /api/v1/bookings/:id/checkout
 * 
 * @param id - Booking ID
 * @param items - Array of service items (can modify from original booking)
 * @param paymentMode - 'CASH' | 'UPI' | 'OTHER'
 */
export async function checkoutBooking(
  id: string, 
  items: CheckoutItem[],
  paymentMode: PaymentMode
): Promise<Booking> {
  const payload: CheckoutPayload = { items, paymentMode };
  const res = await apiClient.post<any>(`${BASE}/${id}/checkout`, payload);
  // apiClient wraps in { data: response }, so we need res.data.data.booking
  return res.data?.data?.booking;
}

/**
 * Simple complete booking (for High-Strength UI drag-to-pay)
 * Uses the booking's existing items and specified payment method
 * 
 * @param id - Booking ID
 * @param paymentMethod - 'CASH' or 'BANK' (maps to 'CASH' or 'UPI')
 */
export async function completeBookingWithPayment(
  id: string,
  paymentMethod: 'CASH' | 'BANK'
): Promise<Booking> {
  // Map BANK to UPI for backend
  const paymentMode: PaymentMode = paymentMethod === 'BANK' ? 'UPI' : 'CASH';
  
  // First get the booking to get its items
  const booking = await getBooking(id) as any;
  
  // If booking has items, use checkout endpoint to preserve them and set payment mode
  if (booking?.items && Array.isArray(booking.items) && booking.items.length > 0) {
    const items: CheckoutItem[] = booking.items.map((item: any) => ({
      serviceId: item.serviceId,
      quantity: 1,
    }));
    return checkoutBooking(id, items, paymentMode);
  }
  
  // Fallback: just update status to COMPLETED if no items
  return updateBookingStatus(id, 'COMPLETED' as BookingStatus);
}

/**
 * Check availability for a time slot
 * POST /api/v1/bookings/check-availability
 */
export async function checkAvailability(
  businessId: string,
  scheduledAt: string,
  durationMinutes: number
): Promise<{
  available: boolean;
  currentCount: number;
  maxCapacity: number;
  requestedSlot: {
    start: string;
    end: string;
    durationMinutes: number;
  };
}> {
  const res = await apiClient.post<any>(`${BASE}/check-availability`, {
    businessId,
    scheduledAt,
    durationMinutes,
  });
  // apiClient wraps in { data: response }, so we need res.data.data
  return res.data?.data;
}

export const BookingService = {
  create: createBooking,
  getById: getBooking,
  listByBusiness: listBookingsByBusiness,
  updateStatus: updateBookingStatus,
  confirm: confirmBooking,
  cancel: cancelBooking,
  reject: rejectBooking,
  checkout: checkoutBooking,
  completeWithPayment: completeBookingWithPayment,
  checkAvailability,
  validateBusinessSetup,
};

export default BookingService;
