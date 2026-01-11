"use strict";
/**
 * Availability Zod Schemas
 *
 * Schemas for availability checking and capacity management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiSlotAvailabilityResponseSchema = exports.slotAvailabilitySchema = exports.capacityInfoSchema = exports.availabilityResponseSchema = exports.suggestedAssignmentSchema = exports.availableStaffSchema = exports.availableResourceSchema = exports.multiSlotAvailabilityRequestSchema = exports.availabilityRequestSchema = void 0;
const zod_1 = require("zod");
// Availability check request
exports.availabilityRequestSchema = zod_1.z.object({
    scheduledAt: zod_1.z.string().datetime(),
    endAt: zod_1.z.string().datetime().optional(),
    durationMinutes: zod_1.z.number().int().min(5).optional(),
    resourceId: zod_1.z.string().cuid().optional(),
    staffId: zod_1.z.string().cuid().optional(),
});
// Multi-slot availability request
exports.multiSlotAvailabilityRequestSchema = zod_1.z.object({
    slots: zod_1.z.array(zod_1.z.object({
        scheduledAt: zod_1.z.string().datetime(),
        endAt: zod_1.z.string().datetime().optional(),
        durationMinutes: zod_1.z.number().int().min(5).optional(),
    })).min(1).max(10),
    resourceId: zod_1.z.string().cuid().optional(),
    staffId: zod_1.z.string().cuid().optional(),
});
// Available resource response
exports.availableResourceSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    name: zod_1.z.string(),
    utilizationPercent: zod_1.z.number().min(0).max(100),
    isLinkedStaffAvailable: zod_1.z.boolean(),
});
// Available staff response
exports.availableStaffSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    name: zod_1.z.string(),
    utilizationPercent: zod_1.z.number().min(0).max(100),
    linkedResourceIds: zod_1.z.array(zod_1.z.string().cuid()),
});
// Suggested assignment
exports.suggestedAssignmentSchema = zod_1.z.object({
    resourceId: zod_1.z.string().cuid(),
    resourceName: zod_1.z.string(),
    staffId: zod_1.z.string().cuid(),
    staffName: zod_1.z.string(),
    reason: zod_1.z.enum(['lowest_utilization', 'linked_pair_available', 'customer_preference']),
});
// Availability response with suggestions
exports.availabilityResponseSchema = zod_1.z.object({
    available: zod_1.z.boolean(),
    availableResources: zod_1.z.array(exports.availableResourceSchema),
    availableStaff: zod_1.z.array(exports.availableStaffSchema),
    suggestedAssignment: exports.suggestedAssignmentSchema.nullable(),
    effectiveCapacity: zod_1.z.number().int().min(0),
    currentUtilization: zod_1.z.number().min(0).max(100),
    message: zod_1.z.string().optional(),
});
// Capacity info response
exports.capacityInfoSchema = zod_1.z.object({
    activeResources: zod_1.z.number().int().min(0),
    activeStaff: zod_1.z.number().int().min(0),
    effectiveCapacity: zod_1.z.number().int().min(0),
    warning: zod_1.z.enum(['staff_shortage', 'resource_shortage', 'zero_capacity']).optional(),
    warningMessage: zod_1.z.string().optional(),
});
// Slot availability (for multi-slot response)
exports.slotAvailabilitySchema = zod_1.z.object({
    scheduledAt: zod_1.z.string().datetime(),
    endAt: zod_1.z.string().datetime(),
    available: zod_1.z.boolean(),
    availableResources: zod_1.z.array(exports.availableResourceSchema),
    availableStaff: zod_1.z.array(exports.availableStaffSchema),
});
// Multi-slot availability response
exports.multiSlotAvailabilityResponseSchema = zod_1.z.object({
    slots: zod_1.z.array(exports.slotAvailabilitySchema),
    effectiveCapacity: zod_1.z.number().int().min(0),
});
