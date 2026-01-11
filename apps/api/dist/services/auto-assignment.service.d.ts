/**
 * Auto-Assignment Service
 *
 * Handles intelligent allocation of resources and staff to bookings.
 * Uses load balancing, linked pair preferences, and customer preferences.
 * Prevents race conditions using database transactions with row-level locking.
 */
export interface AssignmentPreferences {
    preferredResourceId?: string;
    preferredStaffId?: string;
    customerPreferredStaffId?: string;
}
export interface AssignmentResult {
    success: boolean;
    resourceId?: string;
    resourceName?: string;
    staffId?: string;
    staffName?: string;
    reason?: string;
    alternatives?: AlternativeSlot[];
}
export interface AlternativeSlot {
    scheduledAt: Date;
    endAt: Date;
    availableResources: number;
    availableStaff: number;
}
export interface AllocationResult extends AssignmentResult {
    bookingId?: string;
}
declare class AutoAssignmentService {
    /**
     * Find the best available resource and staff for a time slot
     * Does NOT lock or allocate - just finds the best match
     */
    findBestAssignment(businessId: string, scheduledAt: Date, endAt: Date, preferences?: AssignmentPreferences): Promise<AssignmentResult>;
    /**
     * Allocate resource and staff to a booking with transaction lock
     * Uses Serializable isolation to prevent race conditions
     */
    allocateWithLock(businessId: string, bookingId: string, scheduledAt: Date, endAt: Date, preferences?: AssignmentPreferences): Promise<AllocationResult>;
    /**
     * Find alternative time slots when requested slot is unavailable
     */
    findAlternativeSlots(businessId: string, requestedStart: Date, requestedEnd: Date, maxAlternatives?: number): Promise<AlternativeSlot[]>;
    /**
     * Reassign a booking to a different resource/staff
     */
    reassign(bookingId: string, businessId: string, newResourceId?: string, newStaffId?: string): Promise<AllocationResult>;
}
export declare const autoAssignmentService: AutoAssignmentService;
export {};
//# sourceMappingURL=auto-assignment.service.d.ts.map