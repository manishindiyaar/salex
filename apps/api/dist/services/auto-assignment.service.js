"use strict";
/**
 * Auto-Assignment Service
 *
 * Handles intelligent allocation of resources and staff to bookings.
 * Uses load balancing, linked pair preferences, and customer preferences.
 * Prevents race conditions using database transactions with row-level locking.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoAssignmentService = void 0;
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const availability_service_1 = require("./availability.service");
class AutoAssignmentService {
    /**
     * Find the best available resource and staff for a time slot
     * Does NOT lock or allocate - just finds the best match
     */
    async findBestAssignment(businessId, scheduledAt, endAt, preferences) {
        // Get availability with suggestions
        const availability = await availability_service_1.availabilityService.getAvailabilityWithSuggestions(businessId, scheduledAt, endAt, preferences?.customerPreferredStaffId);
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
            const resource = availability.availableResources.find(r => r.id === preferences.preferredResourceId);
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
            const staff = availability.availableStaff.find(s => s.id === preferences.preferredStaffId);
            if (!staff) {
                return {
                    success: false,
                    reason: 'Selected staff is not available for this time slot',
                    alternatives: [],
                };
            }
        }
        // Use manual selections if provided, otherwise use suggestions
        let selectedResource;
        let selectedStaff;
        if (preferences?.preferredResourceId && preferences?.preferredStaffId) {
            // Both manually selected
            selectedResource = availability.availableResources.find(r => r.id === preferences.preferredResourceId);
            selectedStaff = availability.availableStaff.find(s => s.id === preferences.preferredStaffId);
        }
        else if (preferences?.preferredResourceId) {
            // Resource manually selected, find best staff
            selectedResource = availability.availableResources.find(r => r.id === preferences.preferredResourceId);
            // Prefer linked staff if available
            const linkedStaff = availability.availableStaff.find(s => s.linkedResourceIds.includes(selectedResource.id));
            selectedStaff = linkedStaff || availability.availableStaff[0];
        }
        else if (preferences?.preferredStaffId) {
            // Staff manually selected, find best resource
            selectedStaff = availability.availableStaff.find(s => s.id === preferences.preferredStaffId);
            // Prefer linked resource if available
            const linkedResource = availability.availableResources.find(r => selectedStaff.linkedResourceIds.includes(r.id));
            selectedResource = linkedResource || availability.availableResources[0];
        }
        else if (availability.suggestedAssignment) {
            // Use the suggested assignment
            selectedResource = availability.availableResources.find(r => r.id === availability.suggestedAssignment.resourceId);
            selectedStaff = availability.availableStaff.find(s => s.id === availability.suggestedAssignment.staffId);
        }
        else {
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
    async allocateWithLock(businessId, bookingId, scheduledAt, endAt, preferences) {
        try {
            const result = await shared_types_1.prisma.$transaction(async (tx) => {
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
                const bookedResourceIds = bookedResources.map(b => b.resourceId).filter(Boolean);
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
                const bookedStaffIds = bookedStaff.map(b => b.staffId).filter(Boolean);
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
                    throw new errors_1.ConflictError('No resources available for this time slot');
                }
                if (availableStaffMembers.length === 0) {
                    throw new errors_1.ConflictError('No staff available for this time slot');
                }
                // Select resource and staff
                let selectedResource = availableResources[0];
                let selectedStaff = availableStaffMembers[0];
                // Handle preferences
                if (preferences?.preferredResourceId) {
                    const preferred = availableResources.find(r => r.id === preferences.preferredResourceId);
                    if (!preferred) {
                        throw new errors_1.ConflictError('Selected resource is no longer available');
                    }
                    selectedResource = preferred;
                }
                if (preferences?.preferredStaffId) {
                    const preferred = availableStaffMembers.find(s => s.id === preferences.preferredStaffId);
                    if (!preferred) {
                        throw new errors_1.ConflictError('Selected staff is no longer available');
                    }
                    selectedStaff = preferred;
                }
                // If no preferences, try to find linked pairs
                if (!preferences?.preferredResourceId && !preferences?.preferredStaffId) {
                    // Check customer preference
                    if (preferences?.customerPreferredStaffId) {
                        const preferredStaff = availableStaffMembers.find(s => s.id === preferences.customerPreferredStaffId);
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
                    }
                    else {
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
                isolationLevel: shared_types_1.Prisma.TransactionIsolationLevel.Serializable,
                timeout: 10000, // 10 second timeout
            });
            logger_1.logger.info({
                bookingId,
                resourceId: result.resourceId,
                staffId: result.staffId,
            }, 'Booking allocated');
            return result;
        }
        catch (error) {
            if (error instanceof errors_1.ConflictError) {
                throw error;
            }
            // Handle serialization failure (race condition)
            if (error?.code === 'P2034') {
                throw new errors_1.ConflictError('Slot was just booked by another request. Please try again.');
            }
            logger_1.logger.error({ error, bookingId }, 'Allocation failed');
            throw error;
        }
    }
    /**
     * Find alternative time slots when requested slot is unavailable
     */
    async findAlternativeSlots(businessId, requestedStart, requestedEnd, maxAlternatives = 3) {
        const duration = requestedEnd.getTime() - requestedStart.getTime();
        const alternatives = [];
        // Check slots in 30-minute increments for the next 4 hours
        const checkIntervals = 8; // 4 hours / 30 minutes
        for (let i = 1; i <= checkIntervals && alternatives.length < maxAlternatives; i++) {
            const slotStart = new Date(requestedStart.getTime() + i * 30 * 60 * 1000);
            const slotEnd = new Date(slotStart.getTime() + duration);
            const [availableResources, availableStaff] = await Promise.all([
                availability_service_1.availabilityService.getAvailableResources(businessId, slotStart, slotEnd),
                availability_service_1.availabilityService.getAvailableStaff(businessId, slotStart, slotEnd),
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
    async reassign(bookingId, businessId, newResourceId, newStaffId) {
        const booking = await shared_types_1.prisma.booking.findUnique({
            where: { id: bookingId },
            select: { scheduledAt: true, endAt: true, businessId: true },
        });
        if (!booking || booking.businessId !== businessId) {
            throw new errors_1.ConflictError('Booking not found');
        }
        // Verify new resource is available
        if (newResourceId) {
            const isAvailable = await availability_service_1.availabilityService.isResourceAvailable(newResourceId, booking.scheduledAt, booking.endAt, bookingId);
            if (!isAvailable) {
                throw new errors_1.ConflictError('Selected resource is not available for this time slot');
            }
        }
        // Verify new staff is available
        if (newStaffId) {
            const isAvailable = await availability_service_1.availabilityService.isStaffAvailable(newStaffId, booking.scheduledAt, booking.endAt, bookingId);
            if (!isAvailable) {
                throw new errors_1.ConflictError('Selected staff is not available for this time slot');
            }
        }
        // Update booking
        const updated = await shared_types_1.prisma.booking.update({
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
        logger_1.logger.info({
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
exports.autoAssignmentService = new AutoAssignmentService();
//# sourceMappingURL=auto-assignment.service.js.map