import apiClient from './apiClient';
import {
  Booking,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingStatus,
  Paginated,
} from '../../../../packages/shared-types/src';

/**
 * NOTE: Merchant-only endpoints alignment (see docs/architecture/05-api-specification.md)
 * Spec mentions:
 * - GET  /businesses/{businessId}/bookings
 * - PATCH /bookings/{bookingId}/cancel
 *
 * IMPORTANT: Do NOT modify end-user (WhatsApp) consumer endpoints that allow browsing services,
 * viewing slots, or booking slots. Those public/consumer APIs are separate and must remain untouched.
 */
const BASE = '/bookings';

export interface ListBookingParams {
  page?: number;
  pageSize?: number;
  businessId?: string;
  serviceId?: string;
  status?: BookingStatus;
  dateFrom?: string; // ISO
  dateTo?: string;   // ISO
}

export async function createBooking(payload: CreateBookingRequest) {
  const res = await apiClient.post<Booking, CreateBookingRequest>(`${BASE}`, payload);
  return res.data;
}

export async function updateBooking(id: string, payload: UpdateBookingRequest) {
  const res = await apiClient.put<Booking, UpdateBookingRequest>(`${BASE}/${id}`, payload);
  return res.data;
}

export async function getBooking(id: string) {
  const res = await apiClient.get<Booking>(`${BASE}/${id}`);
  return res.data;
}

/**
 * Merchant: List bookings for a salon (spec-scoped)
 * Spec: GET /businesses/{businessId}/bookings
 */
export async function listBookingsByBusiness(businessId: string) {
  const res = await apiClient.get<any>(`/businesses/${businessId}/bookings`);
  // Backend returns {data: Booking[], message: string, success: boolean}
  // API client wraps it as {data: {data: Booking[], message: string, success: boolean}}
  // So we need to extract res.data.data to get the actual bookings array
  return res.data.data;
}

/**
 * Legacy/flat listing (out of spec). Keep only if backend supports it.
 */
export async function listBookings(params: ListBookingParams = {}) {
  const res = await apiClient.get<Paginated<Booking>>(`${BASE}`, { params });
  return res.data;
}

/**
 * Merchant: Cancel booking
 * Spec: PATCH /bookings/{bookingId}/cancel
 */
export async function cancelBooking(id: string) {
  const res = await apiClient.put<Booking>(`${BASE}/${id}/cancel`);
  return res.data;
}

export async function confirmBooking(id: string) {
  const res = await apiClient.post<Booking>(`${BASE}/${id}/confirm`);
  return res.data;
}

export async function completeBooking(id: string) {
  const res = await apiClient.post<Booking>(`${BASE}/${id}/complete`);
  return res.data;
}

export const BookingService = {
  create: createBooking,
  update: updateBooking,
  getById: getBooking,
  list: listBookings,
  cancel: cancelBooking,
  confirm: confirmBooking,
  complete: completeBooking,
};

export default BookingService;
