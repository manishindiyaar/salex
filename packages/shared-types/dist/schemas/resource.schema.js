"use strict";
/**
 * Resource Management Zod Schemas
 *
 * Schemas for physical bookable resources (chairs, beds, rooms, stations)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceWithStatsSchema = exports.resourceResponseSchema = exports.resourceListQuerySchema = exports.resourceIdSchema = exports.updateResourceSchema = exports.bulkCreateResourceSchema = exports.bulkResourceItemSchema = exports.createResourceSchema = void 0;
const zod_1 = require("zod");
// Resource creation
exports.createResourceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    displayOrder: zod_1.z.number().int().min(0).default(0),
});
// Individual resource for bulk creation
exports.bulkResourceItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    displayOrder: zod_1.z.number().int().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
});
// Bulk resource creation - supports two formats:
// 1. Simple: { count: 3, prefix: 'Chair' } -> creates "Chair 1", "Chair 2", "Chair 3"
// 2. Array: { resources: [{ name: 'Room A' }, { name: 'Room B' }] } -> creates specific resources
exports.bulkCreateResourceSchema = zod_1.z.union([
    // Format 1: count + prefix (auto-generate names)
    zod_1.z.object({
        count: zod_1.z.number().int().min(1).max(50),
        prefix: zod_1.z.string().min(1).max(50).default('Chair'),
    }),
    // Format 2: array of specific resources
    zod_1.z.object({
        resources: zod_1.z.array(exports.bulkResourceItemSchema).min(1).max(50),
    }),
]);
// Resource update
exports.updateResourceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional().nullable(),
    displayOrder: zod_1.z.number().int().min(0).optional(),
});
// Resource ID validation
exports.resourceIdSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
// Resource list query
exports.resourceListQuerySchema = zod_1.z.object({
    businessId: zod_1.z.string().cuid(),
    includeInactive: zod_1.z.boolean().default(false),
});
// Resource response with utilization stats
exports.resourceResponseSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    businessId: zod_1.z.string().cuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    isActive: zod_1.z.boolean(),
    displayOrder: zod_1.z.number(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Resource with stats
exports.resourceWithStatsSchema = exports.resourceResponseSchema.extend({
    utilizationPercent: zod_1.z.number().min(0).max(100),
    activeBookingsCount: zod_1.z.number().int().min(0),
});
