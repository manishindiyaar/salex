/**
 * Local Type Definitions for React Native
 * 
 * React Native-safe type definitions to avoid importing from shared-types
 * which causes Prisma client issues in React Native.
 */

export * from './business';

// Basic shared types
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Business types
export interface Business {
  id: string;
  name: string;
  phoneNumber: string;
  routingCode?: string;
  category?: BusinessCategoryType;
  address?: string;
  hoursOfOperation?: Record<string, { open: string; close: string; closed?: boolean }>;
  maxConcurrentBookings?: number;
  isAcceptingOrders?: boolean;
  isActive?: boolean; // NEW: Business active status
  createdAt: Date;
  updatedAt: Date;
}

// Business category type (matches backend enum)
export type BusinessCategoryType = 'SALON' | 'BEAUTY_PARLOR' | 'SPA' | 'CLINIC' | 'FITNESS' | 'OTHER';

export interface CreateBusinessInput {
  name: string;
  phoneNumber: string;
  routingCode?: string;
  category?: BusinessCategoryType; // NEW: Business category
  hoursOfOperation?: Record<string, { open: string; close: string; closed?: boolean }>;
  maxConcurrentBookings?: number;
  isAcceptingOrders?: boolean;
}

export interface UpdateBusinessInput {
  name?: string;
  phoneNumber?: string;
  routingCode?: string;
  category?: BusinessCategoryType; // NEW: Business category
  address?: string; // NEW: Address field
  hoursOfOperation?: Record<string, { open: string; close: string; closed?: boolean }>;
  maxConcurrentBookings?: number;
  isAcceptingOrders?: boolean;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  isActive: boolean;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  duration: number;
  price: number;
  isActive?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  isActive?: boolean;
}

// Legacy aliases for backward compatibility
export type CreateServiceRequest = CreateServiceInput;
export type UpdateServiceRequest = UpdateServiceInput;

// Staff types
export interface Staff {
  id: string;
  name: string;
  phone?: string;
  isActive: boolean;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffWithStats extends Staff {
  utilizationPercent: number;
  activeBookingsCount: number;
  linkedResources: LinkedResource[];
}

export interface CreateStaffInput {
  name: string;
  phone?: string;
  isActive?: boolean;
}

export interface UpdateStaffInput {
  name?: string;
  phone?: string;
  isActive?: boolean;
}

export interface LinkResourceInput {
  resourceId: string;
}

export interface LinkedResource {
  id: string;
  name: string;
}

// Resource types
export interface Resource {
  id: string;
  name: string;
  isActive: boolean;
  description?: string;
  businessId: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceWithStats extends Resource {
  utilizationPercent: number;
  activeBookingsCount: number;
}

export interface CreateResourceInput {
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateResourceInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface BulkCreateResourceInput {
  resources: CreateResourceInput[];
}

// Booking types
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  staffId?: string;
  resourceId?: string;
  scheduledAt: Date;
  duration: number;
  status: BookingStatus;
  notes?: string;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingInput {
  businessId?: string; // Optional - can be passed separately
  customerId?: string; // Optional for walk-ins
  serviceIds: string[]; // Array of service IDs (multi-service support)
  scheduledAt: string; // ISO datetime string
  notes?: string;
  source?: 'whatsapp' | 'manual' | 'walk-in';
  // Optional resource/staff allocation (auto-assigned if not provided)
  resourceId?: string;
  staffId?: string;
  // Customer preference for staff (used in auto-assignment)
  preferredStaffId?: string;
}

// Analytics types
export interface AnalyticsSummary {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  bookingsByStatus: Record<BookingStatus, number>;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    bookingCount: number;
    revenue: number;
  }>;
  dailyStats: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
}