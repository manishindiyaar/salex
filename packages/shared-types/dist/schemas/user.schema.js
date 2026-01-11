"use strict";
/**
 * User & Authentication Zod Schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = exports.otpVerifySchema = exports.otpRequestSchema = void 0;
const zod_1 = require("zod");
// Phone number validation (E.164 format)
const phoneSchema = zod_1.z.string().regex(/^\+\d{10,15}$/, 'Invalid phone format. Use E.164 format (e.g., +919876543210)');
// OTP Request
exports.otpRequestSchema = zod_1.z.object({
    phone: phoneSchema,
});
// OTP Verify
exports.otpVerifySchema = zod_1.z.object({
    phone: phoneSchema,
    otp: zod_1.z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
});
// User creation (internal)
exports.createUserSchema = zod_1.z.object({
    phone: phoneSchema,
    role: zod_1.z.enum(['OWNER', 'STAFF']).default('OWNER'),
});
// User update
exports.updateUserSchema = zod_1.z.object({
    role: zod_1.z.enum(['OWNER', 'STAFF']).optional(),
});
