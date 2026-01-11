/**
 * Availability Zod Schemas
 * 
 * Schemas for availability checking and capacity management
 */

import { z } from 'zod';

// Availability check request
export const availabilityRequestSchema = z.object({
  scheduledAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(5).optional(),
  resourceId: z.string().cuid().optional(),
  staffId: z.string().cuid().optional(),
});

export type AvailabilityRequest = z.infer<typeof availabilityRequestSchema>;

// Multi-slot availability request
export const multiSlotAvailabilityRequestSchema = z.object({
  slots: z.array(z.object({
    scheduledAt: z.string().datetime(),
    endAt: z.string().datetime().optional(),
    durationMinutes: z.number().int().min(5).optional(),
  })).min(1).max(10),
  resourceId: z.string().cuid().optional(),
  staffId: z.string().cuid().optional(),
});

export type MultiSlotAvailabilityRequest = z.infer<typeof multiSlotAvailabilityRequestSchema>;

// Available resource response
export const availableResourceSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  utilizationPercent: z.number().min(0).max(100),
  isLinkedStaffAvailable: z.boolean(),
});

export type AvailableResource = z.infer<typeof availableResourceSchema>;

// Available staff response
export const availableStaffSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  utilizationPercent: z.number().min(0).max(100),
  linkedResourceIds: z.array(z.string().cuid()),
});

export type AvailableStaff = z.infer<typeof availableStaffSchema>;

// Suggested assignment
export const suggestedAssignmentSchema = z.object({
  resourceId: z.string().cuid(),
  resourceName: z.string(),
  staffId: z.string().cuid(),
  staffName: z.string(),
  reason: z.enum(['lowest_utilization', 'linked_pair_available', 'customer_preference']),
});

export type SuggestedAssignment = z.infer<typeof suggestedAssignmentSchema>;

// Availability response with suggestions
export const availabilityResponseSchema = z.object({
  available: z.boolean(),
  availableResources: z.array(availableResourceSchema),
  availableStaff: z.array(availableStaffSchema),
  suggestedAssignment: suggestedAssignmentSchema.nullable(),
  effectiveCapacity: z.number().int().min(0),
  currentUtilization: z.number().min(0).max(100),
  message: z.string().optional(),
});

export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>;

// Capacity info response
export const capacityInfoSchema = z.object({
  activeResources: z.number().int().min(0),
  activeStaff: z.number().int().min(0),
  effectiveCapacity: z.number().int().min(0),
  warning: z.enum(['staff_shortage', 'resource_shortage', 'zero_capacity']).optional(),
  warningMessage: z.string().optional(),
});

export type CapacityInfo = z.infer<typeof capacityInfoSchema>;

// Slot availability (for multi-slot response)
export const slotAvailabilitySchema = z.object({
  scheduledAt: z.string().datetime(),
  endAt: z.string().datetime(),
  available: z.boolean(),
  availableResources: z.array(availableResourceSchema),
  availableStaff: z.array(availableStaffSchema),
});

export type SlotAvailability = z.infer<typeof slotAvailabilitySchema>;

// Multi-slot availability response
export const multiSlotAvailabilityResponseSchema = z.object({
  slots: z.array(slotAvailabilitySchema),
  effectiveCapacity: z.number().int().min(0),
});

export type MultiSlotAvailabilityResponse = z.infer<typeof multiSlotAvailabilityResponseSchema>;
