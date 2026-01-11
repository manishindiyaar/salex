/**
 * Auto-Assignment Service
 * 
 * Handles intelligent allocation of resources and staff to bookings.
 * Uses load balancing, linked pair preferences, and customer preferences.
 * Prevents race conditions using database transactions with row-level locking.
 */

import { prisma, Prisma } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { ConflictError } from '../utils/errors';
import { availabilityService, AvailableResource, AvailableStaff } from './availability.service';

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

class AutoAssignmentService {
  /**
   * Find the best available resource and staff for a time slot
   * Does NOT lock or allocate - just finds the best match
   */
  async findBestAssignment(
    businessId: string,
    scheduledAt: Date,
    endAt: Date,
    preferences?: AssignmentPreferences
  ): Promise<AssignmentResult> {
    // Get availability with suggestions
    const availability = await availabilityService.getAvailabilityWithSuggestions(
      businessId,
      scheduledAt,
      endAt,
      preferences?.customerPreferredStaffId
    );

    if (!availability.available) {
      // Find alternative slots
      const alternatives = await this.findAlternativeSlots(businessId, scheduledAt, endAt);
      
      return {
        success: false,
        reason: availability.message || 'No availability for this time slot',
        alternatives,
      };
    }

    // Handle manual resource selection
    if (preferences?.preferredResourceId) {
      const resource = availability.availableResources.find(
        r => r.id === preferences.preferredResourceId
      );
      if (!resource) {
        return {
          success: false,
          reason: 'Selected resource is not available for this time slot',
          alternatives: [],
        };
      }
    }

    // Handle manual staff selection
    if (preferences?.preferredStaffId) {
      const staff = availability.availableStaff.find(
        s => s.id === preferences.preferredStaffId
      );
      if (!staff) {
        return {
          success: false,
          reason: 'Selected staff is not available for this time slot',
          alternatives: [],
        };
      }
    }

    // Use manual selections if provided, otherwise use suggestions
    let selectedResource: AvailableResource;
    let selectedStaff: AvailableStaff;

    if (preferences?.preferredResourceId && preferences?.preferredStaffId) {
      // Both manually selected
      selectedResource = availability.availableResources.find(
        r => r.id === preferences.preferredResourceId
      )!;
      selectedStaff = availability.availableStaff.find(
        s => s.id === preferences.preferredStaffId
      )!;
    } else if (preferences?.preferredResourceId) {
      // Resource manually selected, find best staff
      selectedResource = availability.availableResources.find(
        r => r.id === preferences.preferredResourceId
      )!;
      // Prefer linked staff if available
      const linkedStaff = availability.availableStaff.find(
        s => s.linkedResourceIds.includes(selectedResource.id)
      );
      selectedStaff = linkedStaff || availability.availableStaff[0];
    } else if (preferences?.preferredStaffId) {
      // Staff manually selected, find best resource
      selectedStaff = availability.availableStaff.find(
        s => s.id === preferences.preferredStaffId
      )!;
      // Prefer linked resource if available
      const linkedResource = availability.availableResources.find(
        r => selectedStaff.linkedResourceIds.includes(r.id)
      );
      selectedResource = linkedResource || availability.availableResources[0];
    } else if (availability.suggestedAssignment) {
      // Use the suggested assignment
      selectedResource = availability.availableResources.find(
        r => r.id === availability.suggestedAssignment!.resourceId
      )!;
      selectedStaff = availability.availableStaff.find(
        s => s.id === availability.suggestedAssignment!.staffId
      )!;
    } else {
      // Fallback to first available (lowest utilization)
      selectedResource = availability.availableResources[0];
      selectedStaff = availability.availableStaff[0];
    }

    return {
      success: true,
      resourceId: selectedResource.id,
      resourceName: selectedResource.name,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      reason: availability.suggestedAssignment?.reason || 'lowest_utilization',
    };
  }

  /**
   * Allocate resource and staff to a booking with transaction lock
   * Uses Serializable isolation to prevent race conditions
   */
  async allocateWithLock(
    businessId: string,
    bookingId: string,
    scheduledAt: Date,
    endAt: Date,
    preferences?: AssignmentPreferences
  ): Promise<AllocationResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Re-check availability within transaction
        // Get booked resources
        const bookedResources = await tx.booking.findMany({
          where: {
            businessId,
            resourceId: { not: null },
            id: { not: bookingId },
            status: { in: ['PENDING', 'CONFIRMED'] },
            AND: [
              { scheduledAt: { lt: endAt } },
              { endAt: { gt: scheduledAt } },
            ],
          },
          select: { resourceId: true },
        });
        const bookedResourceIds = bookedResources.map(b => b.resourceId).filter(Boolean) as string[];

        // Get booked staff
        const bookedStaff = await tx.booking.findMany({
          where: {
            businessId,
            staffId: { not: null },
            id: { not: bookingId },
            status: { in: ['PENDING', 'CONFIRMED'] },
            AND: [
              { scheduledAt: { lt: endAt } },
              { endAt: { gt: scheduledAt } },
            ],
          },
          select: { staffId: true },
        });
        const bookedStaffIds = bookedStaff.map(b => b.staffId).filter(Boolean) as string[];

        // Get available resources
        const availableResources = await tx.resource.findMany({
          where: {
            businessId,
            isActive: true,
            id: { notIn: bookedResourceIds },
          },
          include: {
            staffLinks: { select: { staffId: true } },
          },
        });

        // Get available staff
        const availableStaffMembers = await tx.staff.findMany({
          where: {
            businessId,
            isActive: true,
            id: { notIn: bookedStaffIds },
          },
          include: {
            resourceLinks: { select: { resourceId: true } },
          },
        });

        if (availableResources.length === 0) {
          throw new ConflictError('No resources available for this time slot');
        }

        if (availableStaffMembers.length === 0) {
          throw new ConflictError('No staff available for this time slot');
        }

        // Select resource and staff
        let selectedResource = availableResources[0];
        let selectedStaff = availableStaffMembers[0];

        // Handle preferences
        if (preferences?.preferredResourceId) {
          const preferred = availableResources.find(r => r.id === preferences.preferredResourceId);
          if (!preferred) {
            throw new ConflictError('Selected resource is no longer available');
          }
          selectedResource = preferred;
        }

        if (preferences?.preferredStaffId) {
          const preferred = availableStaffMembers.find(s => s.id === preferences.preferredStaffId);
          if (!preferred) {
            throw new ConflictError('Selected staff is no longer available');
          }
          selectedStaff = preferred;
        }

        // If no preferences, try to find linked pairs
        if (!preferences?.preferredResourceId && !preferences?.preferredStaffId) {
          // Check customer preference
          if (preferences?.customerPreferredStaffId) {
            const preferredStaff = availableStaffMembers.find(
              s => s.id === preferences.customerPreferredStaffId
            );
            if (preferredStaff) {
              selectedStaff = preferredStaff;
              // Find linked resource
              const linkedResourceId = preferredStaff.resourceLinks[0]?.resourceId;
              if (linkedResourceId) {
                const linkedResource = availableResources.find(r => r.id === linkedResourceId);
                if (linkedResource) {
                  selectedResource = linkedResource;
                }
              }
            }
          } else {
            // Find linked pair
            for (const resource of availableResources) {
              const linkedStaffIds = resource.staffLinks.map(l => l.staffId);
              const linkedStaff = availableStaffMembers.find(s => linkedStaffIds.includes(s.id));
              if (linkedStaff) {
                selectedResource = resource;
                selectedStaff = linkedStaff;
                break;
              }
            }
          }
        }

        // Update the booking with allocation
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            resourceId: selectedResource.id,
            staffId: selectedStaff.id,
          },
        });

        return {
          success: true,
          bookingId,
          resourceId: selectedResource.id,
          resourceName: selectedResource.name,
          staffId: selectedStaff.id,
          staffName: selectedStaff.name,
        };
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000, // 10 second timeout
      });

      logger.info({
        bookingId,
        resourceId: result.resourceId,
        staffId: result.staffId,
      }, 'Booking allocated');

      return result;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      
      // Handle serialization failure (race condition)
      if ((error as any)?.code === 'P2034') {
        throw new ConflictError('Slot was just booked by another request. Please try again.');
      }

      logger.error({ error, bookingId }, 'Allocation failed');
      throw error;
    }
  }

  /**
   * Find alternative time slots when requested slot is unavailable
   */
  async findAlternativeSlots(
    businessId: string,
    requestedStart: Date,
    requestedEnd: Date,
    maxAlternatives = 3
  ): Promise<AlternativeSlot[]> {
    const duration = requestedEnd.getTime() - requestedStart.getTime();
    const alternatives: AlternativeSlot[] = [];

    // Check slots in 30-minute increments for the next 4 hours
    const checkIntervals = 8; // 4 hours / 30 minutes
    
    for (let i = 1; i <= checkIntervals && alternatives.length < maxAlternatives; i++) {
      const slotStart = new Date(requestedStart.getTime() + i * 30 * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + duration);

      const [availableResources, availableStaff] = await Promise.all([
        availabilityService.getAvailableResources(businessId, slotStart, slotEnd),
        availabilityService.getAvailableStaff(businessId, slotStart, slotEnd),
      ]);

      if (availableResources.length > 0 && availableStaff.length > 0) {
        alternatives.push({
          scheduledAt: slotStart,
          endAt: slotEnd,
          availableResources: availableResources.length,
          availableStaff: availableStaff.length,
        });
      }
    }

    return alternatives;
  }

  /**
   * Reassign a booking to a different resource/staff
   */
  async reassign(
    bookingId: string,
    businessId: string,
    newResourceId?: string,
    newStaffId?: string
  ): Promise<AllocationResult> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { scheduledAt: true, endAt: true, businessId: true },
    });

    if (!booking || booking.businessId !== businessId) {
      throw new ConflictError('Booking not found');
    }

    // Verify new resource is available
    if (newResourceId) {
      const isAvailable = await availabilityService.isResourceAvailable(
        newResourceId,
        booking.scheduledAt,
        booking.endAt,
        bookingId
      );
      if (!isAvailable) {
        throw new ConflictError('Selected resource is not available for this time slot');
      }
    }

    // Verify new staff is available
    if (newStaffId) {
      const isAvailable = await availabilityService.isStaffAvailable(
        newStaffId,
        booking.scheduledAt,
        booking.endAt,
        bookingId
      );
      if (!isAvailable) {
        throw new ConflictError('Selected staff is not available for this time slot');
      }
    }

    // Update booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(newResourceId && { resourceId: newResourceId }),
        ...(newStaffId && { staffId: newStaffId }),
      },
      include: {
        resource: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    });

    logger.info({
      bookingId,
      newResourceId,
      newStaffId,
    }, 'Booking reassigned');

    return {
      success: true,
      bookingId,
      resourceId: updated.resource?.id,
      resourceName: updated.resource?.name,
      staffId: updated.staff?.id,
      staffName: updated.staff?.name,
    };
  }
}

export const autoAssignmentService = new AutoAssignmentService();
