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

import { prisma } from '@salex/shared-types';
import { logger } from '../utils/logger';

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
// Bulk Availability Types (Req 6.1–6.6)
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

class AvailabilityService {
  /**
   * Get effective capacity for a business
   * Capacity = min(active_resources, active_staff)
   */
  async getEffectiveCapacity(businessId: string): Promise<CapacityInfo> {
    const [activeResources, activeStaff] = await Promise.all([
      prisma.resource.count({ where: { businessId, isActive: true } }),
      prisma.staff.count({ where: { businessId, isActive: true } }),
    ]);

    const effectiveCapacity = Math.min(activeResources, activeStaff);

    let warning: CapacityInfo['warning'];
    let warningMessage: string | undefined;

    if (effectiveCapacity === 0) {
      warning = 'zero_capacity';
      if (activeResources === 0 && activeStaff === 0) {
        warningMessage = 'No resources or staff configured. Add resources and staff to accept bookings.';
      } else if (activeResources === 0) {
        warningMessage = 'No resources configured. Add chairs/rooms to accept bookings.';
      } else {
        warningMessage = 'No staff configured. Add staff members to accept bookings.';
      }
    } else if (activeStaff < activeResources) {
      warning = 'staff_shortage';
      warningMessage = `You have ${activeResources} resources but only ${activeStaff} staff. Consider adding ${activeResources - activeStaff} more staff to maximize capacity.`;
    } else if (activeResources < activeStaff) {
      warning = 'resource_shortage';
      warningMessage = `You have ${activeStaff} staff but only ${activeResources} resources. Consider adding ${activeStaff - activeResources} more chairs/rooms to maximize capacity.`;
    }

    return {
      activeResources,
      activeStaff,
      effectiveCapacity,
      warning,
      warningMessage,
    };
  }

  /**
   * Check if a time slot is available for booking (legacy method for backward compatibility)
   */
  async checkAvailability(
    businessId: string,
    requestedStart: Date,
    requestedEnd: Date,
    excludeBookingId?: string
  ): Promise<AvailabilityResult> {
    const capacity = await this.getEffectiveCapacity(businessId);

    if (capacity.effectiveCapacity === 0) {
      return {
        available: false,
        currentCount: 0,
        maxCapacity: 0,
        message: capacity.warningMessage || 'No capacity available',
      };
    }

    // Count overlapping bookings using the overlap formula
    const overlappingCount = await prisma.booking.count({
      where: {
        businessId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        AND: [
          { scheduledAt: { lt: requestedEnd } },
          { endAt: { gt: requestedStart } },
        ],
      },
    });

    const available = overlappingCount < capacity.effectiveCapacity;

    logger.debug({
      businessId,
      requestedStart,
      requestedEnd,
      overlappingCount,
      maxCapacity: capacity.effectiveCapacity,
      available,
    }, 'Availability check');

    return {
      available,
      currentCount: overlappingCount,
      maxCapacity: capacity.effectiveCapacity,
      message: available
        ? undefined
        : `Slot unavailable. ${overlappingCount}/${capacity.effectiveCapacity} concurrent bookings.`,
    };
  }

  /**
   * Get all available resources for a time slot
   */
  async getAvailableResources(
    businessId: string,
    requestedStart: Date,
    requestedEnd: Date
  ): Promise<AvailableResource[]> {
    // Get all active resources
    const resources = await prisma.resource.findMany({
      where: { businessId, isActive: true },
      include: {
        staffLinks: {
          include: { staff: { select: { id: true, isActive: true } } },
        },
      },
    });

    // Get resource IDs that are booked during this time
    const bookedResourceIds = await prisma.booking.findMany({
      where: {
        businessId,
        resourceId: { not: null },
        status: { in: ['PENDING', 'CONFIRMED'] },
        AND: [
          { scheduledAt: { lt: requestedEnd } },
          { endAt: { gt: requestedStart } },
        ],
      },
      select: { resourceId: true },
    }).then(bookings => bookings.map(b => b.resourceId).filter(Boolean) as string[]);

    // Get booked staff IDs for linked staff availability check
    const bookedStaffIds = await prisma.booking.findMany({
      where: {
        businessId,
        staffId: { not: null },
        status: { in: ['PENDING', 'CONFIRMED'] },
        AND: [
          { scheduledAt: { lt: requestedEnd } },
          { endAt: { gt: requestedStart } },
        ],
      },
      select: { staffId: true },
    }).then(bookings => bookings.map(b => b.staffId).filter(Boolean) as string[]);

    // Calculate utilization for each resource (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const availableResources: AvailableResource[] = [];

    for (const resource of resources) {
      if (bookedResourceIds.includes(resource.id)) {
        continue; // Resource is booked
      }

      // Calculate utilization
      const completedBookings = await prisma.booking.findMany({
        where: {
          resourceId: resource.id,
          status: 'COMPLETED',
          scheduledAt: { gte: weekAgo },
        },
        select: { scheduledAt: true, endAt: true },
      });

      const totalMinutesInWeek = 7 * 24 * 60;
      const bookedMinutes = completedBookings.reduce((sum, booking) => {
        const duration = (booking.endAt.getTime() - booking.scheduledAt.getTime()) / 60000;
        return sum + duration;
      }, 0);
      const utilizationPercent = Math.round((bookedMinutes / totalMinutesInWeek) * 100);

      // Check if any linked staff is available
      const linkedStaffIds = resource.staffLinks
        .filter(link => link.staff.isActive)
        .map(link => link.staff.id);
      const isLinkedStaffAvailable = linkedStaffIds.length === 0 || 
        linkedStaffIds.some(id => !bookedStaffIds.includes(id));

      availableResources.push({
        id: resource.id,
        name: resource.name,
        utilizationPercent: Math.min(utilizationPercent, 100),
        isLinkedStaffAvailable,
      });
    }

    // Sort by utilization (lowest first for load balancing)
    return availableResources.sort((a, b) => a.utilizationPercent - b.utilizationPercent);
  }

  /**
   * Get all available staff for a time slot
   */
  async getAvailableStaff(
    businessId: string,
    requestedStart: Date,
    requestedEnd: Date
  ): Promise<AvailableStaff[]> {
    // Get all active staff
    const staffMembers = await prisma.staff.findMany({
      where: { businessId, isActive: true },
      include: {
        resourceLinks: { select: { resourceId: true } },
      },
    });

    // Get staff IDs that are booked during this time
    const bookedStaffIds = await prisma.booking.findMany({
      where: {
        businessId,
        staffId: { not: null },
        status: { in: ['PENDING', 'CONFIRMED'] },
        AND: [
          { scheduledAt: { lt: requestedEnd } },
          { endAt: { gt: requestedStart } },
        ],
      },
      select: { staffId: true },
    }).then(bookings => bookings.map(b => b.staffId).filter(Boolean) as string[]);

    // Calculate utilization for each staff member (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const availableStaff: AvailableStaff[] = [];

    for (const staff of staffMembers) {
      if (bookedStaffIds.includes(staff.id)) {
        continue; // Staff is booked
      }

      // Calculate utilization
      const completedBookings = await prisma.booking.findMany({
        where: {
          staffId: staff.id,
          status: 'COMPLETED',
          scheduledAt: { gte: weekAgo },
        },
        select: { scheduledAt: true, endAt: true },
      });

      const totalMinutesInWeek = 7 * 24 * 60;
      const bookedMinutes = completedBookings.reduce((sum, booking) => {
        const duration = (booking.endAt.getTime() - booking.scheduledAt.getTime()) / 60000;
        return sum + duration;
      }, 0);
      const utilizationPercent = Math.round((bookedMinutes / totalMinutesInWeek) * 100);

      availableStaff.push({
        id: staff.id,
        name: staff.name,
        utilizationPercent: Math.min(utilizationPercent, 100),
        linkedResourceIds: staff.resourceLinks.map(link => link.resourceId),
      });
    }

    // Sort by utilization (lowest first for load balancing)
    return availableStaff.sort((a, b) => a.utilizationPercent - b.utilizationPercent);
  }

  /**
   * Get availability with suggestions for optimal assignment
   */
  async getAvailabilityWithSuggestions(
    businessId: string,
    requestedStart: Date,
    requestedEnd: Date,
    preferredStaffId?: string
  ): Promise<AvailabilityWithSuggestions> {
    const [capacity, availableResources, availableStaff] = await Promise.all([
      this.getEffectiveCapacity(businessId),
      this.getAvailableResources(businessId, requestedStart, requestedEnd),
      this.getAvailableStaff(businessId, requestedStart, requestedEnd),
    ]);

    const available = availableResources.length > 0 && availableStaff.length > 0;

    let suggestedAssignment: SuggestedAssignment | null = null;

    if (available) {
      // Check for customer preference first
      if (preferredStaffId) {
        const preferredStaff = availableStaff.find(s => s.id === preferredStaffId);
        if (preferredStaff) {
          // Find a resource linked to this staff, or lowest utilization resource
          const linkedResource = availableResources.find(r => 
            preferredStaff.linkedResourceIds.includes(r.id)
          );
          const resource = linkedResource || availableResources[0];
          
          suggestedAssignment = {
            resourceId: resource.id,
            resourceName: resource.name,
            staffId: preferredStaff.id,
            staffName: preferredStaff.name,
            reason: 'customer_preference',
          };
        }
      }

      // If no preference or preferred staff unavailable, check for linked pairs
      if (!suggestedAssignment) {
        for (const resource of availableResources) {
          if (resource.isLinkedStaffAvailable) {
            const linkedStaff = availableStaff.find(s => 
              s.linkedResourceIds.includes(resource.id)
            );
            if (linkedStaff) {
              suggestedAssignment = {
                resourceId: resource.id,
                resourceName: resource.name,
                staffId: linkedStaff.id,
                staffName: linkedStaff.name,
                reason: 'linked_pair_available',
              };
              break;
            }
          }
        }
      }

      // Fall back to lowest utilization
      if (!suggestedAssignment && availableResources.length > 0 && availableStaff.length > 0) {
        suggestedAssignment = {
          resourceId: availableResources[0].id,
          resourceName: availableResources[0].name,
          staffId: availableStaff[0].id,
          staffName: availableStaff[0].name,
          reason: 'lowest_utilization',
        };
      }
    }

    // Calculate current utilization
    const totalBookings = await prisma.booking.count({
      where: {
        businessId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        AND: [
          { scheduledAt: { lt: requestedEnd } },
          { endAt: { gt: requestedStart } },
        ],
      },
    });
    const currentUtilization = capacity.effectiveCapacity > 0 
      ? Math.round((totalBookings / capacity.effectiveCapacity) * 100)
      : 0;

    let message: string | undefined;
    if (!available) {
      if (availableResources.length === 0 && availableStaff.length === 0) {
        message = 'No resources or staff available for this time slot';
      } else if (availableResources.length === 0) {
        message = 'No resources available for this time slot';
      } else {
        message = 'No staff available for this time slot';
      }
    }

    return {
      available,
      availableResources,
      availableStaff,
      suggestedAssignment,
      effectiveCapacity: capacity.effectiveCapacity,
      currentUtilization,
      message,
    };
  }

  /**
   * Check if a specific resource is available
   */
  async isResourceAvailable(
    resourceId: string,
    requestedStart: Date,
    requestedEnd: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const conflictCount = await prisma.booking.count({
      where: {
        resourceId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        AND: [
          { scheduledAt: { lt: requestedEnd } },
          { endAt: { gt: requestedStart } },
        ],
      },
    });

    return conflictCount === 0;
  }

  /**
   * Check if a specific staff member is available
   */
  async isStaffAvailable(
    staffId: string,
    requestedStart: Date,
    requestedEnd: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const conflictCount = await prisma.booking.count({
      where: {
        staffId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        AND: [
          { scheduledAt: { lt: requestedEnd } },
          { endAt: { gt: requestedStart } },
        ],
      },
    });

    return conflictCount === 0;
  }

  /**
   * Get all bookings that overlap with a time range
   */
  async getOverlappingBookings(
    businessId: string,
    requestedStart: Date,
    requestedEnd: Date
  ): Promise<Array<{
    id: string;
    scheduledAt: Date;
    endAt: Date;
    status: string;
    resourceId: string | null;
    staffId: string | null;
    items: Array<{ id: string; nameSnapshot: string; priceSnapshot: unknown }>;
    customer: { name: string | null; phoneNumber: string } | null;
  }>> {
    const bookings = await prisma.booking.findMany({
      where: {
        businessId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        AND: [
          { scheduledAt: { lt: requestedEnd } },
          { endAt: { gt: requestedStart } },
        ],
      },
      include: {
        items: true,
        customer: {
          select: { name: true, phoneNumber: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return bookings;
  }

  // ============================================
  // Bulk Availability Methods (Req 6.1–6.6)
  // ============================================

  /**
   * Retrieve effective capacity, overlapping bookings, active staff, and active resources
   * for a search range in a single bounded set of queries (independent of slot count).
   * 
   * Issues exactly 3 parallel queries:
   * 1. Active resource count
   * 2. Active staff count
   * 3. Overlapping PENDING|CONFIRMED bookings in [start, end)
   * 
   * Req 6.1: bounded, slot-count-independent queries
   * Req 6.3: effectiveCapacity = min(activeResources, activeStaff)
   */
  async getBulkAvailabilityData(
    businessId: string,
    start: Date,
    end: Date,
  ): Promise<BulkAvailabilityData> {
    const [activeResourceCount, activeStaffCount, bookings] = await Promise.all([
      prisma.resource.count({ where: { businessId, isActive: true } }),
      prisma.staff.count({ where: { businessId, isActive: true } }),
      prisma.booking.findMany({
        where: {
          businessId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          AND: [
            { scheduledAt: { lt: end } },
            { endAt: { gt: start } },
          ],
        },
        select: {
          id: true,
          scheduledAt: true,
          endAt: true,
          resourceId: true,
          staffId: true,
        },
      }),
    ]);

    const effectiveCapacity = Math.min(activeResourceCount, activeStaffCount);

    return {
      effectiveCapacity,
      bookings,
      activeResourceCount,
      activeStaffCount,
    };
  }

  /**
   * Pure in-memory slot availability check using the capacity-count formula.
   * 
   * A slot is bookable iff:
   * - effectiveCapacity > 0, AND
   * - the count of overlapping bookings is strictly less than effectiveCapacity
   * 
   * Overlap: booking.scheduledAt < slotEnd && booking.endAt > slotStart (Req 6.4)
   * Bookable: overlapCount < effectiveCapacity (Req 6.5)
   * 
   * This is the canonical engine rule going forward for custom flows.
   */
  isSlotBookable(
    data: BulkAvailabilityData,
    slotStart: Date,
    slotEnd: Date,
  ): boolean {
    if (data.effectiveCapacity <= 0) {
      return false;
    }

    const overlapCount = data.bookings.filter(
      (b) => b.scheduledAt < slotEnd && b.endAt > slotStart
    ).length;

    return overlapCount < data.effectiveCapacity;
  }

  /**
   * Pure in-memory slot availability check reproducing the legacy
   * `getAvailabilityWithSuggestions(...).available` determination.
   * 
   * Legacy logic: available = availableResources.length > 0 && availableStaff.length > 0
   * where a resource is "available" iff no overlapping booking has that resourceId,
   * and a staff member is "available" iff no overlapping booking has that staffId.
   * 
   * Bookings with null resourceId do NOT consume a resource slot.
   * Bookings with null staffId do NOT consume a staff slot.
   * 
   * This reproduces the per-entity free-resource-AND-free-staff determination
   * used by the Default_Flow time_picker for migration parity (Req 6.6, 9.2).
   */
  isSlotBookableLegacyParity(
    data: BulkAvailabilityData,
    slotStart: Date,
    slotEnd: Date,
  ): boolean {
    // If no resources or no staff configured, not bookable
    if (data.activeResourceCount <= 0 || data.activeStaffCount <= 0) {
      return false;
    }

    // Find bookings that overlap with this specific slot
    const overlapping = data.bookings.filter(
      (b) => b.scheduledAt < slotEnd && b.endAt > slotStart
    );

    // Count distinct busy resource IDs (only non-null resourceIds count)
    const busyResourceIds = new Set<string>();
    for (const b of overlapping) {
      if (b.resourceId !== null) {
        busyResourceIds.add(b.resourceId);
      }
    }

    // Count distinct busy staff IDs (only non-null staffIds count)
    const busyStaffIds = new Set<string>();
    for (const b of overlapping) {
      if (b.staffId !== null) {
        busyStaffIds.add(b.staffId);
      }
    }

    // A resource is "available" if it's not in the busy set
    // availableResources = activeResourceCount - busyResourceIds.size
    const availableResourceCount = data.activeResourceCount - busyResourceIds.size;

    // A staff member is "available" if it's not in the busy set
    // availableStaff = activeStaffCount - busyStaffIds.size
    const availableStaffCount = data.activeStaffCount - busyStaffIds.size;

    // Legacy: available = availableResources.length > 0 && availableStaff.length > 0
    return availableResourceCount > 0 && availableStaffCount > 0;
  }

  /**
   * Calculate end time from start time and total duration
   */
  calculateEndTime(scheduledAt: Date, totalDurationMinutes: number): Date {
    return new Date(scheduledAt.getTime() + totalDurationMinutes * 60 * 1000);
  }
}

export const availabilityService = new AvailabilityService();
