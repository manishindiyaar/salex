"use strict";
/**
 * Business Zod Schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessRoutingCodeSchema = exports.updateBusinessSchema = exports.createBusinessSchema = exports.businessCategorySchema = void 0;
exports.formatPhoneToE164 = formatPhoneToE164;
const zod_1 = require("zod");
// Phone number validation (E.164 format) - more lenient to accept various formats
// Accepts: +919876543210, +1234567890, etc.
const phoneSchema = zod_1.z.string().regex(/^\+\d{10,15}$/, 'Invalid phone format. Use E.164 format (e.g., +919876543210)');
// Hours of operation schema
const hoursOfOperationSchema = zod_1.z.record(zod_1.z.object({
    open: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    close: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    closed: zod_1.z.boolean().optional(),
})).optional();
// Routing code validation (exactly 4 digits)
const routingCodeSchema = zod_1.z.string().length(4).regex(/^\d{4}$/, 'Routing code must be exactly 4 digits');
// Business category enum (matches Prisma enum)
exports.businessCategorySchema = zod_1.z.enum([
    'SALON',
    'BEAUTY_PARLOR',
    'SPA',
    'CLINIC',
    'FITNESS',
    'OTHER',
]);
// Business creation
exports.createBusinessSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    phoneNumber: phoneSchema,
    routingCode: routingCodeSchema.optional(),
    category: exports.businessCategorySchema.optional(), // NEW: Business category
    hoursOfOperation: hoursOfOperationSchema,
    maxConcurrentBookings: zod_1.z.number().int().min(1).max(20).default(1).optional(),
    isAcceptingOrders: zod_1.z.boolean().default(true).optional(),
});
// Business update - all fields optional
exports.updateBusinessSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    phoneNumber: phoneSchema.optional(),
    routingCode: routingCodeSchema.optional(),
    category: exports.businessCategorySchema.optional(), // NEW: Business category
    hoursOfOperation: hoursOfOperationSchema,
    maxConcurrentBookings: zod_1.z.number().int().min(1).max(20).optional(),
    isAcceptingOrders: zod_1.z.boolean().optional(),
    address: zod_1.z.string().max(500).optional(), // NEW: Address field
});
// Business lookup by routing code
exports.businessRoutingCodeSchema = zod_1.z.object({
    code: routingCodeSchema,
});
/**
 * Helper function to format phone number to E.164 format
 * @param phone - Phone number in any format
 * @param countryCode - Country code (default: +91 for India)
 * @returns Phone number in E.164 format
 */
function formatPhoneToE164(phone, countryCode = '+91') {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // If already has country code (starts with country code digits)
    if (phone.startsWith('+')) {
        return '+' + digits;
    }
    // If starts with 0, remove it (common in India)
    const cleanDigits = digits.startsWith('0') ? digits.slice(1) : digits;
    // Add country code
    return countryCode + cleanDigits;
}
