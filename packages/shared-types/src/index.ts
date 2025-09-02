/**
 * packages/shared-types
 * Single source of truth for domain models, DTOs, and API contracts.
 * IMPORTANT: App code must import exclusively from this package.
 */

/* ========== Common/Utility ========== */
export type ID = string;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* ========== API Contracts (error/response) ========== */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  status?: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/* ========== Business ========== */
export interface Business {
  id: ID;
  name: string;
  businessType: 'SALON';
  phoneNumber: string;
  address: string;
  description?: string;
  hoursOfOperation?: Record<string, { open: string; close: string; closed: boolean }>;
  ownerId: string;
  routingCode?: string;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}

export interface CreateBusinessRequest {
  name: string;
  businessType: 'SALON'; // Currently only SALON supported
  phoneNumber: string; // E.164 format required
  address: string; // 10-200 characters required
  hoursOfOperation?: Record<string, { open: string; close: string; closed: boolean }>;
}

export interface UpdateBusinessRequest {
  name?: string;
  businessType?: 'SALON';
  phoneNumber?: string; // E.164 format
  address?: string; // 10-200 characters
  hoursOfOperation?: Record<string, { open: string; close: string; closed: boolean }>;
}

/* ========== Service (Catalog) ========== */
export interface Service {
  id: ID;
  businessId: ID;
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
  currency?: string;
  active?: boolean;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}

export interface CreateServiceRequest {
  businessId: ID;
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
  currency?: string;
  active?: boolean;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  durationMinutes?: number;
  priceCents?: number;
  currency?: string;
  active?: boolean;
}

/* ========== Booking ========== */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: ID;
  businessId: ID;
  serviceId: ID;
  customerId?: ID;
  startTime: string; // ISO
  endTime: string; // ISO
  status: BookingStatus;
  notes?: string;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}

export interface CreateBookingRequest {
  businessId: ID;
  serviceId: ID;
  customerId?: ID;
  startTime: string; // ISO
  notes?: string;
}

export interface UpdateBookingRequest {
  startTime?: string; // ISO
  endTime?: string; // ISO
  status?: BookingStatus;
  notes?: string;
}

/* ========== Analytics ========== */
export interface RevenueByDay {
  date: string; // YYYY-MM-DD
  revenueCents: number;
  bookings: number;
}

export interface TopServicesItem {
  serviceId: ID;
  name: string;
  count: number;
  revenueCents: number;
}

export interface AnalyticsSummary {
  businessId: ID;
  totalRevenueCents: number;
  totalBookings: number;
  uniqueCustomers: number;
  revenueByDay: RevenueByDay[];
  topServices: TopServicesItem[];
  from?: string; // ISO
  to?: string; // ISO
}

/* ========== Re-exports for package consumers ========== */
// Nothing else needed; this file is the public surface.
