/**
 * Availability Engine Service
 *
 * Prevents double-bookings using time overlap detection and per-resource/staff availability.
 *
 * Key formula: (existing.scheduledAt < requested.endAt) AND (existing.endAt > requested.scheduledAt)
 *
 * This detects ANY overlap between time ranges, including:
 * - Existing booking starts during requested slot
 * - Existing booking ends during requested slot
 * - Existing booking completely contains requested slot
 * - Requested slot completely contains existing booking
 */
export interface AvailabilityResult {
    available: boolean;
    currentCount: number;
    maxCapacity: number;
    message?: string;
}
export interface TimeSlot {
    scheduledAt: Date;
    endAt: Date;
}
export interface CapacityInfo {
    activeResources: number;
    activeStaff: number;
    effectiveCapacity: number;
    warning?: 'staff_shortage' | 'resource_shortage' | 'zero_capacity';
    warningMessage?: string;
}
export interface AvailableResource {
    id: string;
    name: string;
    utilizationPercent: number;
    isLinkedStaffAvailable: boolean;
}
export interface AvailableStaff {
    id: string;
    name: string;
    utilizationPercent: number;
    linkedResourceIds: string[];
}
export interface SuggestedAssignment {
    resourceId: string;
    resourceName: string;
    staffId: string;
    staffName: string;
    reason: 'lowest_utilization' | 'linked_pair_available' | 'customer_preference';
}
export interface AvailabilityWithSuggestions {
    available: boolean;
    availableResources: AvailableResource[];
    availableStaff: AvailableStaff[];
    suggestedAssignment: SuggestedAssignment | null;
    effectiveCapacity: number;
    currentUtilization: number;
    message?: string;
}
declare class AvailabilityService {
    /**
     * Get effective capacity for a business
     * Capacity = min(active_resources, active_staff)
     */
    getEffectiveCapacity(businessId: string): Promise<CapacityInfo>;
    /**
     * Check if a time slot is available for booking (legacy method for backward compatibility)
     */
    checkAvailability(businessId: string, requestedStart: Date, requestedEnd: Date, excludeBookingId?: string): Promise<AvailabilityResult>;
    /**
     * Get all available resources for a time slot
     */
    getAvailableResources(businessId: string, requestedStart: Date, requestedEnd: Date): Promise<AvailableResource[]>;
    /**
     * Get all available staff for a time slot
     */
    getAvailableStaff(businessId: string, requestedStart: Date, requestedEnd: Date): Promise<AvailableStaff[]>;
    /**
     * Get availability with suggestions for optimal assignment
     */
    getAvailabilityWithSuggestions(businessId: string, requestedStart: Date, requestedEnd: Date, preferredStaffId?: string): Promise<AvailabilityWithSuggestions>;
    /**
     * Check if a specific resource is available
     */
    isResourceAvailable(resourceId: string, requestedStart: Date, requestedEnd: Date, excludeBookingId?: string): Promise<boolean>;
    /**
     * Check if a specific staff member is available
     */
    isStaffAvailable(staffId: string, requestedStart: Date, requestedEnd: Date, excludeBookingId?: string): Promise<boolean>;
    /**
     * Get all bookings that overlap with a time range
     */
    getOverlappingBookings(businessId: string, requestedStart: Date, requestedEnd: Date): Promise<Array<{
        id: string;
        scheduledAt: Date;
        endAt: Date;
        status: string;
        resourceId: string | null;
        staffId: string | null;
        items: Array<{
            id: string;
            nameSnapshot: string;
            priceSnapshot: unknown;
        }>;
        customer: {
            name: string | null;
            phoneNumber: string;
        } | null;
    }>>;
    /**
     * Calculate end time from start time and total duration
     */
    calculateEndTime(scheduledAt: Date, totalDurationMinutes: number): Date;
}
export declare const availabilityService: AvailabilityService;
export {};
//# sourceMappingURL=availability.service.d.ts.map