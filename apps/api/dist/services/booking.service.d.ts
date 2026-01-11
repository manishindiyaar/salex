/**
 * Booking Service
 *
 * Handles booking CRUD operations with:
 * - Multi-service support (combos)
 * - Price snapshots (frozen at booking time)
 * - Resource and staff allocation (auto or manual)
 * - Availability engine integration
 * - Status transitions validation
 * - Checkout flow with item modification
 */
import { Booking, BookingItem } from '@salex/shared-types';
import { CreateBookingInput, UpdateBookingStatusInput, CheckoutInput, UpdateAllocationInput, BookingStatusType } from '@salex/shared-types';
export type BookingWithItems = Booking & {
    items: BookingItem[];
    customer?: {
        name: string | null;
        phoneNumber: string;
    } | null;
    resource?: {
        id: string;
        name: string;
    } | null;
    staff?: {
        id: string;
        name: string;
    } | null;
};
declare class BookingService {
    /**
     * Create a new booking with multi-service support and resource/staff allocation
     *
     * Flow:
     * 1. Fetch all services and validate they exist
     * 2. Calculate total duration and end time
     * 3. Calculate total price
     * 4. Check capacity (zero capacity prevention)
     * 5. Create booking with price snapshots in a transaction
     * 6. Auto-assign or validate manual resource/staff selection
     */
    create(ownerId: string, data: CreateBookingInput): Promise<BookingWithItems>;
    /**
     * Quick book - create booking with auto-assignment in one step
     */
    quickBook(ownerId: string, data: {
        businessId: string;
        serviceIds: string[];
        scheduledAt: string;
        customerId?: string;
        notes?: string;
    }): Promise<BookingWithItems>;
    /**
     * Get a booking by ID with allocation info
     */
    getById(id: string, ownerId: string): Promise<BookingWithItems>;
    /**
     * List bookings for a business with filters and allocation info
     */
    listByBusinessId(businessId: string, ownerId: string, options?: {
        status?: BookingStatusType;
        from?: string;
        to?: string;
        resourceId?: string;
        staffId?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{
        bookings: BookingWithItems[];
        total: number;
    }>;
    /**
     * Update booking allocation (change resource/staff)
     */
    updateAllocation(id: string, ownerId: string, data: UpdateAllocationInput): Promise<BookingWithItems>;
    /**
     * Update booking status with transition validation
     */
    updateStatus(id: string, ownerId: string, data: UpdateBookingStatusInput): Promise<BookingWithItems>;
    /**
     * Checkout flow - complete a booking with item modification
     */
    checkout(id: string, ownerId: string, data: CheckoutInput): Promise<BookingWithItems>;
    /**
     * Cancel a booking
     */
    cancel(id: string, ownerId: string, cancelledBy: 'user' | 'salon'): Promise<BookingWithItems>;
    /**
     * Get booking confirmation message for WhatsApp
     */
    getConfirmationMessage(booking: BookingWithItems): string;
}
export declare const bookingService: BookingService;
export {};
//# sourceMappingURL=booking.service.d.ts.map