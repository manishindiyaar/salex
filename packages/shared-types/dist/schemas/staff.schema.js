"use strict";
/**
 * Staff Management Zod Schemas
 *
 * Schemas for staff members who perform services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffWithStatsSchema = exports.linkedResourceSchema = exports.staffResponseSchema = exports.linkResourceSchema = exports.staffListQuerySchema = exports.staffIdSchema = exports.updateStaffSchema = exports.createStaffSchema = void 0;
const zod_1 = require("zod");
// Staff creation
exports.createStaffSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    phone: zod_1.z.string().max(20).optional(),
    linkedResourceIds: zod_1.z.array(zod_1.z.string().cuid()).optional(),
});
// Staff update
exports.updateStaffSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    phone: zod_1.z.string().max(20).optional().nullable(),
});
// Staff ID validation
exports.staffIdSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
// Staff list query
exports.staffListQuerySchema = zod_1.z.object({
    businessId: zod_1.z.string().cuid(),
    includeInactive: zod_1.z.boolean().default(false),
});
// Staff-Resource link
exports.linkResourceSchema = zod_1.z.object({
    resourceId: zod_1.z.string().cuid(),
    isPrimary: zod_1.z.boolean().default(false),
});
// Staff response
exports.staffResponseSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    businessId: zod_1.z.string().cuid(),
    name: zod_1.z.string(),
    phone: zod_1.z.string().nullable(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Linked resource info
exports.linkedResourceSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    name: zod_1.z.string(),
    isPrimary: zod_1.z.boolean(),
});
// Staff with stats and linked resources
exports.staffWithStatsSchema = exports.staffResponseSchema.extend({
    linkedResources: zod_1.z.array(exports.linkedResourceSchema),
    utilizationPercent: zod_1.z.number().min(0).max(100),
    activeBookingsCount: zod_1.z.number().int().min(0),
});
