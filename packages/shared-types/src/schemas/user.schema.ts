/**
 * User & Authentication Zod Schemas
 */

import { z } from 'zod';

// Phone number validation (E.164 format)
const phoneSchema = z.string().regex(/^\+\d{10,15}$/, 'Invalid phone format. Use E.164 format (e.g., +919876543210)');

// OTP Request
export const otpRequestSchema = z.object({
  phone: phoneSchema,
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

// OTP Verify
export const otpVerifySchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

// User creation (internal)
export const createUserSchema = z.object({
  phone: phoneSchema,
  role: z.enum(['OWNER', 'STAFF']).default('OWNER'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// User update
export const updateUserSchema = z.object({
  role: z.enum(['OWNER', 'STAFF']).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
