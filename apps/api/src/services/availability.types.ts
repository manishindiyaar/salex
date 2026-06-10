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

// ============================================
// Bulk Availability Types (Req 6.1-6.6)
// ============================================

export interface BulkBookingRow {
  id: string;
  scheduledAt: Date;
  endAt: Date;
  resourceId: string | null;
  staffId: string | null;
}

export interface BulkAvailabilityData {
  effectiveCapacity: number;       // min(activeResources, activeStaff) (Req 6.3)
  bookings: BulkBookingRow[];      // PENDING|CONFIRMED overlapping [start,end)
  activeResourceCount: number;
  activeStaffCount: number;
}
