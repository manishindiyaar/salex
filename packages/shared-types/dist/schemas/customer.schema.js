"use strict";
/**
 * Customer Zod Schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertCustomerSchema = exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
// Phone number validation (E.164 format or WhatsApp wa_id)
const phoneSchema = zod_1.z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone format');
// Customer creation
exports.createCustomerSchema = zod_1.z.object({
    phoneNumber: phoneSchema,
    name: zod_1.z.string().min(1).max(100).optional(),
});
// Customer update
exports.updateCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    isBlocked: zod_1.z.boolean().optional(),
});
// Customer upsert (for WhatsApp flow)
exports.upsertCustomerSchema = zod_1.z.object({
    phoneNumber: phoneSchema,
    name: zod_1.z.string().min(1).max(100).optional(),
});
