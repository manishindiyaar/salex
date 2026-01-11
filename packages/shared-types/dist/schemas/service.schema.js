"use strict";
/**
 * Service Catalog Zod Schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceListQuerySchema = exports.serviceIdSchema = exports.updateServiceSchema = exports.createServiceSchema = void 0;
const zod_1 = require("zod");
// Service creation
exports.createServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    price: zod_1.z.number().positive().multipleOf(0.01),
    durationMinutes: zod_1.z.number().int().min(5).max(480).default(30),
    isActive: zod_1.z.boolean().default(true),
});
// Service update
exports.updateServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional().nullable(),
    price: zod_1.z.number().positive().multipleOf(0.01).optional(),
    durationMinutes: zod_1.z.number().int().min(5).max(480).optional(),
    isActive: zod_1.z.boolean().optional(),
});
// Service ID validation
exports.serviceIdSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
// Service list query
exports.serviceListQuerySchema = zod_1.z.object({
    businessId: zod_1.z.string().cuid(),
    includeInactive: zod_1.z.boolean().default(false),
});
