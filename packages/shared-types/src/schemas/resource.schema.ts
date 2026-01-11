/**
 * Resource Management Zod Schemas
 * 
 * Schemas for physical bookable resources (chairs, beds, rooms, stations)
 */

import { z } from 'zod';

// Resource creation
export const createResourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().min(0).default(0),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;

// Individual resource for bulk creation
export const bulkResourceItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Bulk resource creation - supports two formats:
// 1. Simple: { count: 3, prefix: 'Chair' } -> creates "Chair 1", "Chair 2", "Chair 3"
// 2. Array: { resources: [{ name: 'Room A' }, { name: 'Room B' }] } -> creates specific resources
export const bulkCreateResourceSchema = z.union([
  // Format 1: count + prefix (auto-generate names)
  z.object({
    count: z.number().int().min(1).max(50),
    prefix: z.string().min(1).max(50).default('Chair'),
  }),
  // Format 2: array of specific resources
  z.object({
    resources: z.array(bulkResourceItemSchema).min(1).max(50),
  }),
]);

export type BulkCreateResourceInput = z.infer<typeof bulkCreateResourceSchema>;

// Resource update
export const updateResourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
});

export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

// Resource ID validation
export const resourceIdSchema = z.object({
  id: z.string().cuid(),
});

export type ResourceIdInput = z.infer<typeof resourceIdSchema>;

// Resource list query
export const resourceListQuerySchema = z.object({
  businessId: z.string().cuid(),
  includeInactive: z.boolean().default(false),
});

export type ResourceListQueryInput = z.infer<typeof resourceListQuerySchema>;

// Resource response with utilization stats
export const resourceResponseSchema = z.object({
  id: z.string().cuid(),
  businessId: z.string().cuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  displayOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ResourceResponse = z.infer<typeof resourceResponseSchema>;

// Resource with stats
export const resourceWithStatsSchema = resourceResponseSchema.extend({
  utilizationPercent: z.number().min(0).max(100),
  activeBookingsCount: z.number().int().min(0),
});

export type ResourceWithStats = z.infer<typeof resourceWithStatsSchema>;
